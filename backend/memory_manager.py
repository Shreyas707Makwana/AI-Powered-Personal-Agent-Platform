import os
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

import numpy as np
from dotenv import load_dotenv
from supabase import create_client, Client

from rag_search import embed_text, vector_to_pgvector_literal, get_db_connection, load_embedding_model

load_dotenv()

# Env
MEMORY_TOP_K = int(os.getenv("MEMORY_TOP_K", "6"))
EMBED_DIM = int(os.getenv("MEMORY_EMBEDDING_DIM", "384"))
MEMORY_AUTOSAVE_DEFAULT = os.getenv("MEMORY_AUTOSAVE_DEFAULT", "true").lower() == "true"

# Supabase clients
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # anon/public
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY)

_sb_public: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
_sb_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def _pgvector_enabled() -> bool:
    # Simple heuristic: try a small query that touches vector column type
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.close()
        conn.close()
        return True
    except Exception:
        return False


async def embed_texts(texts: List[str]) -> List[List[float]]:
    # Use the same embedding model used for RAG
    model = load_embedding_model()
    emb = model.encode(texts)
    return emb.tolist()


async def _insert_memory_row(payload: Dict[str, Any]) -> Dict[str, Any]:
    res = _sb_public.table("memories").insert(payload).execute()
    return res.data[0]


async def _log_event(user_id: Optional[str], memory_id: Optional[str], action: str, details: Optional[Dict[str, Any]] = None) -> None:
    try:
        _sb_service.table("memory_logs").insert({
            "user_id": user_id,
            "memory_id": memory_id,
            "action": action,
            "details": details or {},
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        print(f"⚠️ memory_logs insert failed (non-blocking): {e}")


async def list_memories(user_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    res = (
        _sb_public
        .table("memories")
        .select("*")
        .eq("owner", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + max(limit - 1, 0))
        .execute()
    )
    return res.data or []


async def delete_memory(user_id: str, memory_id: str) -> None:
    res = (
        _sb_public
        .table("memories")
        .delete()
        .eq("id", memory_id)
        .eq("owner", user_id)
        .execute()
    )
    if not res.data:
        # Might be already deleted or not owned; don't throw to keep idempotency
        pass
    await _log_event(user_id, memory_id, "deleted", None)


async def create_memory(user_id: str, title: str, memory_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    metadata = metadata or {}
    # Dedup check vs last N
    try:
        new_emb = await embed_texts([memory_text])
        new_vec = new_emb[0]
    except Exception as e:
        print(f"⚠️ Embedding failed for memory, proceeding with null embedding: {e}")
        new_vec = None

    # Retrieve recent memories
    recent = (
        _sb_public
        .table("memories")
        .select("id, memory_text, embedding, updated_at")
        .eq("owner", user_id)
        .order("updated_at", desc=True)
        .limit(50)
        .execute()
    ).data or []

    def _cos_sim(a: List[float], b: List[float]) -> float:
        va, vb = np.array(a), np.array(b)
        denom = (np.linalg.norm(va) * np.linalg.norm(vb)) or 1.0
        return float(np.dot(va, vb) / denom)

    # If similar > 0.9, update timestamp and attach metadata reference
    if new_vec is not None:
        for r in recent:
            emb = r.get("embedding")
            if isinstance(emb, list) and emb:
                try:
                    if _cos_sim(new_vec, emb) > 0.9:
                        # Update updated_at and optionally merge metadata
                        upd_meta = metadata or {}
                        try:
                            current_meta = r.get("metadata") or {}
                            if isinstance(current_meta, dict):
                                current_meta.setdefault("references", []).append(metadata)
                                upd_meta = current_meta
                        except Exception:
                            pass
                        _sb_public.table("memories").update({
                            "updated_at": datetime.utcnow().isoformat(),
                            "metadata": upd_meta,
                        }).eq("id", r["id"]).eq("owner", user_id).execute()
                        await _log_event(user_id, r["id"], "updated", {"reason": "dedup"})
                        # Return the existing as the created object for ergonomics
                        existing = _sb_public.table("memories").select("*").eq("id", r["id"]).single().execute().data
                        return existing
                except Exception:
                    continue

    payload: Dict[str, Any] = {
        "owner": user_id,
        "title": title[:100],
        "memory_text": memory_text[:600],
        "metadata": metadata,
        # Populate legacy columns to satisfy existing NOT NULL constraints in some deployments
        "content": memory_text[:600],
        "tags": [],
    }

    if new_vec is not None:
        # Try saving embedding both in vector col and metadata for fallback reads
        payload["embedding"] = new_vec
        md = payload["metadata"] or {}
        md["embedding_copy"] = new_vec
        payload["metadata"] = md

    row = await _insert_memory_row(payload)
    await _log_event(user_id, row.get("id"), "created", None)
    return row


async def retrieve_relevant_memories(user_id: str, query: str, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
    k = top_k or MEMORY_TOP_K
    # Try pgvector similarity first
    try:
        query_emb = embed_text(query)
        qvec = vector_to_pgvector_literal(query_emb)
        conn = get_db_connection()
        cur = conn.cursor()
        sql = (
            "SELECT id, title, memory_text, metadata, 1 - (embedding <=> %s::vector) as similarity, created_at "
            "FROM memories WHERE owner = %s ORDER BY similarity DESC LIMIT %s"
        )
        cur.execute(sql, (qvec, user_id, k))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        out = []
        for r in rows:
            # psycopg2 without RealDictCursor returns tuples; ensure mapping by index if needed
            # To keep robust, handle both tuple and dict
            if isinstance(r, dict):
                out.append({
                    "id": r.get("id"),
                    "title": r.get("title"),
                    "memory_text": r.get("memory_text"),
                    "metadata": r.get("metadata"),
                    "similarity": float(r.get("similarity")),
                    "created_at": r.get("created_at"),
                })
            else:
                # tuple ordering from SELECT
                out.append({
                    "id": r[0],
                    "title": r[1],
                    "memory_text": r[2],
                    "metadata": r[3],
                    "similarity": float(r[4]),
                    "created_at": r[5],
                })
        return out
    except Exception as e:
        print(f"⚠️ Vector retrieval failed, falling back: {e}")
        # Fallback: brute-force cosine on last N
        query_emb = await embed_texts([query])
        q = np.array(query_emb[0])
        res = (
            _sb_public
            .table("memories")
            .select("id, title, memory_text, metadata, embedding, created_at")
            .eq("owner", user_id)
            .order("updated_at", desc=True)
            .limit(200)
            .execute()
        ).data or []
        scored: List[Tuple[float, Dict[str, Any]]] = []
        for m in res:
            emb = m.get("embedding") or (m.get("metadata") or {}).get("embedding_copy")
            if isinstance(emb, list) and emb:
                v = np.array(emb)
                denom = (np.linalg.norm(q) * np.linalg.norm(v)) or 1.0
                sim = float(np.dot(q, v) / denom)
                scored.append((sim, m))
        scored.sort(key=lambda x: x[0], reverse=True)
        out = []
        for sim, m in scored[:k]:
            m2 = dict(m)
            m2["similarity"] = float(sim)
            out.append(m2)
        return out


async def condense_conversation_to_memory(user_id: str, conversation_text: str, attention_score: Optional[float] = None) -> Dict[str, Any]:
    # Robust summarizer that mirrors the fallback logic in main.chat_with_llama
    from openai import OpenAI
    import openai
    import time

    hf_api_key = os.getenv("HF_API_KEY")
    if not hf_api_key:
        raise RuntimeError("HF_API_KEY is required for condensation")

    client = OpenAI(base_url="https://router.huggingface.co/v1", api_key=hf_api_key)

    # Model selection
    primary_model = os.getenv("MEMORY_SUMMARIZER_MODEL") or os.getenv("MODEL_ID", "meta-llama/Meta-Llama-3-8B-Instruct")
    fallbacks_raw = os.getenv("MODEL_FALLBACKS", "qwen/Qwen2.5-7B-Instruct, meta-llama/Meta-Llama-3.1-8B-Instruct")
    model_candidates = [m.strip() for m in [primary_model] + fallbacks_raw.split(",") if m.strip()]

    def _parse_retry_schedule() -> List[float]:
        raw = os.getenv("PROVIDER_RETRY_SCHEDULE", "0,1,2,4,8,16")
        try:
            return [float(x.strip()) for x in raw.split(",") if x.strip() != ""]
        except Exception:
            return [0.0, 1.0, 2.0, 4.0, 8.0, 16.0]

    def _messages_to_prompt(msgs: List[Dict[str, str]]) -> str:
        parts = []
        for m in msgs:
            role = m.get("role") or "user"
            content = m.get("content") or ""
            parts.append(f"{role}: {content}")
        parts.append("assistant:")
        return "\n".join(parts)

    prompt = (
        "Condense the following conversation into up to 3 concise memory statements about the user "
        "(preferences, facts, long-term commitments). Each statement must be one sentence, factual, and not sensitive. "
        "If nothing to save, return empty JSON list [].\n\nConversation:\n" + conversation_text + "\n\nReturn JSON: [\"User likes X.\", \"User prefers Y.\"]"
    )
    msgs = [
        {"role": "system", "content": "You output only valid JSON."},
        {"role": "user", "content": prompt},
    ]

    def _call_provider(msgs: List[Dict[str, str]], model_id: str):
        backoffs = _parse_retry_schedule()
        last_err = None
        for i, delay in enumerate(backoffs):
            if delay:
                time.sleep(delay)
            try:
                return client.chat.completions.create(
                    model=model_id,
                    messages=msgs,
                    temperature=0.2,
                    max_tokens=256,
                )
            except openai.APIStatusError as api_err:
                status = getattr(api_err, "status_code", None)
                if status in (429, 502, 503):
                    last_err = api_err
                    continue
                # Fallback to Completions API for non-chat-capable models
                try:
                    err_msg = str(api_err)
                except Exception:
                    err_msg = ""
                if status == 400 and ("not a chat model" in err_msg.lower() or "model_not_supported" in err_msg.lower()):
                    try:
                        return client.completions.create(
                            model=model_id,
                            prompt=_messages_to_prompt(msgs),
                            temperature=0.2,
                            max_tokens=256,
                        )
                    except openai.APIStatusError as api_err2:
                        # Not retryable here; surface to try next model
                        raise RuntimeError(f"Upstream model provider error (completions): {str(api_err2)}")
                # Non-retryable -> surface immediately
                raise RuntimeError(f"Upstream model provider error: {str(api_err)}")
        if last_err is not None:
            raise RuntimeError(f"Upstream model provider error: {str(last_err)}")
        raise RuntimeError("Upstream model provider error: unknown")

    # Try primary + fallbacks
    resp = None
    last_exc: Optional[Exception] = None
    for mid in model_candidates:
        try:
            resp = _call_provider(msgs, mid)
            last_exc = None
            break
        except Exception as e:
            last_exc = e
            continue
    if resp is None and last_exc is not None:
        raise last_exc

    # Extract text safely for both chat and completions responses
    try:
        text = resp.choices[0].message.content or "[]"
    except Exception:
        try:
            text = resp.choices[0].text or "[]"
        except Exception:
            text = "[]"
    try:
        items = json.loads(text)
        if not isinstance(items, list):
            items = []
    except Exception:
        # Try to extract JSON array rudimentarily
        try:
            start = text.find("[")
            end = text.rfind("]")
            items = json.loads(text[start : end + 1]) if start >= 0 and end >= start else []
        except Exception:
            items = []

    created: List[Dict[str, Any]] = []
    for sent in items[:3]:
        if not isinstance(sent, str):
            continue
        s = sent.strip()
        if not s:
            continue
        title = " ".join(s.split()[:8])
        md = {"source": "chat_autosave", "attention": attention_score}
        m = await create_memory(user_id=user_id, title=title, memory_text=s, metadata=md)
        created.append(m)
    await _log_event(user_id, None, "condensed", {"count": len(created)})
    return {"created": created}


# Preferences helpers
async def get_autosave_preference(user_id: str) -> bool:
    try:
        res = _sb_public.table("user_settings").select("autosave_memories").eq("owner", user_id).limit(1).execute()
        if res.data and res.data[0].get("autosave_memories") is not None:
            return bool(res.data[0]["autosave_memories"])
    except Exception:
        pass
    return MEMORY_AUTOSAVE_DEFAULT


async def set_autosave_preference(user_id: str, enabled: bool) -> Dict[str, Any]:
    # Upsert by owner PK
    row = {"owner": user_id, "autosave_memories": bool(enabled), "updated_at": datetime.utcnow().isoformat()}
    existing = _sb_public.table("user_settings").select("owner").eq("owner", user_id).execute()
    if existing.data:
        res = _sb_public.table("user_settings").update(row).eq("owner", user_id).execute()
        return res.data[0]
    else:
        res = _sb_public.table("user_settings").insert(row).execute()
        return res.data[0]
