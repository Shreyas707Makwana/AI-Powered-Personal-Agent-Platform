from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Any, Dict, List, Optional
from uuid import UUID

from auth import required_auth_dependency
from memory_manager import (
    list_memories as mm_list,
    create_memory as mm_create,
    delete_memory as mm_delete,
    retrieve_relevant_memories as mm_retrieve,
    condense_conversation_to_memory as mm_condense,
    get_autosave_preference,
    set_autosave_preference,
)

router = APIRouter(prefix="/api/memories", tags=["memories"])


@router.get("")
async def list_or_search_memories(
    q: Optional[str] = Query(None, description="Query to vector search memories"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: Dict[str, Any] = Depends(required_auth_dependency),
):
    uid = user["id"]
    if q:
        res = await mm_retrieve(uid, q, top_k=limit)
        return res
    res = await mm_list(uid, limit=limit, offset=offset)
    return res


@router.post("")
async def create_memory(body: Dict[str, Any], user: Dict[str, Any] = Depends(required_auth_dependency)):
    uid = user["id"]
    title = (body.get("title") or "").strip()
    memory_text = (body.get("memory_text") or "").strip()
    metadata = body.get("metadata") or {}
    if not title or not memory_text:
        raise HTTPException(status_code=400, detail="title and memory_text are required")
    row = await mm_create(uid, title=title, memory_text=memory_text, metadata=metadata)
    return row


@router.post("/condense")
async def condense(body: Dict[str, Any], user: Dict[str, Any] = Depends(required_auth_dependency)):
    uid = user["id"]
    conversation = (body.get("conversation") or "").strip()
    if not conversation:
        raise HTTPException(status_code=400, detail="conversation is required")
    resp = await mm_condense(uid, conversation)
    return resp


# Preferences (optional endpoints)
@router.get("/preferences")
async def get_prefs(user: Dict[str, Any] = Depends(required_auth_dependency)):
    uid = user["id"]
    autosave = await get_autosave_preference(uid)
    return {"autosave_memories": autosave}


@router.put("/preferences")
async def set_prefs(body: Dict[str, Any], user: Dict[str, Any] = Depends(required_auth_dependency)):
    uid = user["id"]
    autosave = bool(body.get("autosave_memories", False))
    row = await set_autosave_preference(uid, autosave)
    return {"autosave_memories": row.get("autosave_memories", autosave)}


@router.get("/{memory_id}")
async def get_memory(memory_id: UUID, user: Dict[str, Any] = Depends(required_auth_dependency)):
    uid = user["id"]
    from database import supabase
    res = supabase.table("memories").select("*").eq("id", str(memory_id)).eq("owner", uid).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data


@router.delete("/{memory_id}")
async def delete_memory(memory_id: UUID, user: Dict[str, Any] = Depends(required_auth_dependency)):
    uid = user["id"]
    await mm_delete(uid, str(memory_id))
    return {"ok": True}
