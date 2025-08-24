from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

# Database Models
class Document(BaseModel):
    id: Optional[int] = None
    file_name: str
    file_size: int
    upload_timestamp: datetime
    status: str = "processed"
    owner: Optional[str] = None  # UUID of the owner user

class DocumentChunk(BaseModel):
    id: Optional[int] = None
    document_id: int
    chunk_text: str
    chunk_index: int
    embedding: List[float]
    token_count: int
    owner: Optional[str] = None  # UUID of the owner user

class Agent(BaseModel):
    id: Optional[str] = None
    owner: str
    name: str
    avatar_url: Optional[str] = None
    instructions: str
    is_default: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Database operations
async def insert_document(file_name: str, file_size: int, owner_id: Optional[str] = None) -> int:
    """Insert a new document and return its ID"""
    data = {
        "file_name": file_name,
        "file_size": file_size,
        "upload_timestamp": datetime.utcnow().isoformat(),
        "status": "processing",
        "owner": owner_id
    }
    
    result = supabase.table("documents").insert(data).execute()
    return result.data[0]["id"]

async def update_document_status(document_id: int, status: str):
    """Update document status"""
    supabase.table("documents").update({"status": status}).eq("id", document_id).execute()

async def insert_document_chunks(chunks: List[DocumentChunk]):
    """Insert multiple document chunks"""
    chunk_data = [chunk.dict(exclude={"id"}) for chunk in chunks]
    supabase.table("doc_chunks").insert(chunk_data).execute()

async def get_document_chunks(document_id: int) -> List[DocumentChunk]:
    """Get all chunks for a specific document"""
    result = supabase.table("doc_chunks").select("*").eq("document_id", document_id).execute()
    return [DocumentChunk(**chunk) for chunk in result.data]

async def search_similar_chunks(query_embedding: List[float], limit: int = 5) -> List[DocumentChunk]:
    """Search for similar chunks using vector similarity"""
    # This is a simplified version - in production you'd use pgvector for proper similarity search
    result = supabase.table("doc_chunks").select("*").limit(limit).execute()
    return [DocumentChunk(**chunk) for chunk in result.data]

# Agent database operations
async def create_agent(owner_id: str, name: str, instructions: str, avatar_url: Optional[str] = None, is_default: bool = False) -> Dict[str, Any]:
    """Create a new agent and return its data"""
    # If setting as default, unset other default agents for this user
    if is_default:
        supabase.table("agents").update({"is_default": False}).eq("owner", owner_id).eq("is_default", True).execute()
    
    data = {
        "owner": owner_id,
        "name": name,
        "instructions": instructions,
        "avatar_url": avatar_url,
        "is_default": is_default
    }
    
    result = supabase.table("agents").insert(data).execute()
    return result.data[0]

async def update_agent(agent_id: str, owner_id: str, **fields) -> Dict[str, Any]:
    """Update an agent (only owner can update)"""
    # If setting as default, unset other default agents for this user
    if fields.get("is_default"):
        supabase.table("agents").update({"is_default": False}).eq("owner", owner_id).eq("is_default", True).execute()
    
    # Filter out None values and only allow specific fields
    allowed_fields = ["name", "instructions", "avatar_url", "is_default"]
    update_data = {k: v for k, v in fields.items() if k in allowed_fields and v is not None}
    
    result = supabase.table("agents").update(update_data).eq("id", agent_id).eq("owner", owner_id).execute()
    
    if not result.data:
        raise ValueError("Agent not found or access denied")
    
    return result.data[0]

async def delete_agent(agent_id: str, owner_id: str) -> bool:
    """Delete an agent (only owner can delete)"""
    result = supabase.table("agents").delete().eq("id", agent_id).eq("owner", owner_id).execute()
    return len(result.data) > 0

async def list_agents(owner_id: str) -> List[Dict[str, Any]]:
    """List all agents for a user"""
    result = supabase.table("agents").select("*").eq("owner", owner_id).order("created_at", desc=True).execute()
    return result.data

async def get_agent(agent_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific agent (only owner can access)"""
    result = supabase.table("agents").select("*").eq("id", agent_id).eq("owner", owner_id).execute()
    return result.data[0] if result.data else None

# -----------------------------
# Tools: registry, per-agent enablement, and logs
# -----------------------------

async def list_tools() -> List[Dict[str, Any]]:
    """List all available tools from the registry.
    Open endpoint will use this; no sensitive data here.
    """
    res = supabase.table("tools").select("*").order("created_at", desc=True).execute()
    return res.data or []

async def list_agent_tools(agent_id: str, owner_id: str) -> List[Dict[str, Any]]:
    """List per-agent tool enablement for an agent (owner scoped)."""
    # Ensure ownership via agents table check
    agent = await get_agent(agent_id, owner_id)
    if not agent:
        raise ValueError("Agent not found or access denied")
    res = (
        supabase
        .table("agent_tools")
        .select("*")
        .eq("agent_id", agent_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []

async def upsert_agent_tool(agent_id: str, owner_id: str, tool_key: str, enabled: Optional[bool] = None, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Enable/disable or configure a tool for an agent. Owner only.
    Creates row if missing, updates otherwise. Returns the row.
    """
    agent = await get_agent(agent_id, owner_id)
    if not agent:
        raise ValueError("Agent not found or access denied")

    # Try fetch existing
    existing = (
        supabase.table("agent_tools").select("*")
        .eq("agent_id", agent_id).eq("tool_key", tool_key).execute()
    )
    payload: Dict[str, Any] = {"agent_id": agent_id, "tool_key": tool_key}
    if enabled is not None:
        payload["enabled"] = enabled
    if config is not None:
        payload["config"] = config

    if existing.data:
        row_id = existing.data[0]["id"]
        res = supabase.table("agent_tools").update(payload).eq("id", row_id).execute()
        return res.data[0]
    else:
        res = supabase.table("agent_tools").insert(payload).execute()
        return res.data[0]

async def is_tool_enabled(agent_id: str, owner_id: str, tool_key: str) -> bool:
    """Check if a tool is enabled for a given agent and owner."""
    agent = await get_agent(agent_id, owner_id)
    if not agent:
        return False
    res = (
        supabase.table("agent_tools").select("enabled")
        .eq("agent_id", agent_id).eq("tool_key", tool_key).limit(1).execute()
    )
    if not res.data:
        return False
    return bool(res.data[0].get("enabled", False))

async def insert_tool_log(agent_id: Optional[str], user_id: Optional[str], tool_key: str, request_payload: Dict[str, Any], response_payload: Dict[str, Any]) -> None:
    """Insert a tool execution log. Backend should run with service role for unrestricted inserts."""
    payload = {
        "agent_id": agent_id,
        "user_id": user_id,
        "tool_key": tool_key,
        "request_payload": request_payload,
        "response_payload": response_payload,
        "created_at": datetime.utcnow().isoformat(),
    }
    supabase.table("tool_logs").insert(payload).execute()

# -----------------------------
# Long-term conversations & messages
# -----------------------------

class Conversation(BaseModel):
    id: Optional[str] = None
    owner: str
    title: Optional[str] = None  # allow server to set later (auto-title)
    archived: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Message(BaseModel):
    id: Optional[str] = None
    conversation_id: str
    owner: str
    role: str  # 'user' | 'assistant' | 'agent'
    content: str
    agent_id: Optional[str] = None
    tool_used: Optional[str] = None
    created_at: Optional[str] = None

async def create_conversation(owner_id: str, title: Optional[str] = None) -> Dict[str, Any]:
    # Auto-title as "Chat N" per user when title not provided
    if not title:
        try:
            existing = supabase.table("conversations").select("id").eq("owner", owner_id).execute()
            next_n = (len(existing.data) if existing and getattr(existing, "data", None) else 0) + 1
            title = f"Chat {next_n}"
        except Exception:
            # Fallback if count fails
            title = "Chat 1"
    payload = {"owner": owner_id, "title": title}
    res = supabase.table("conversations").insert(payload).execute()
    return res.data[0]

async def list_conversations(owner_id: str) -> List[Dict[str, Any]]:
    res = (
        supabase.table("conversations")
        .select("*")
        .eq("owner", owner_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return res.data or []

async def get_conversation(conv_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
    res = (
        supabase.table("conversations").select("*")
        .eq("id", conv_id).eq("owner", owner_id).limit(1).execute()
    )
    return res.data[0] if res.data else None

async def update_conversation(conv_id: str, owner_id: str, **fields) -> Dict[str, Any]:
    allowed = {k: v for k, v in fields.items() if k in ("title", "archived")}
    if not allowed:
        return await get_conversation(conv_id, owner_id) or {}
    res = (
        supabase.table("conversations").update(allowed)
        .eq("id", conv_id).eq("owner", owner_id).execute()
    )
    if not res.data:
        raise ValueError("Conversation not found or access denied")
    return res.data[0]

async def delete_conversation(conv_id: str, owner_id: str) -> Dict[str, Any]:
    """Delete a conversation and all of its messages for the owner.
    Returns a dict with counts and ok flag. RLS + owner filters protect other users.
    """
    deleted_msgs = 0
    # 1) Delete messages scoped to this conversation and owner (RLS ensures protection)
    try:
        res_messages = (
            supabase.table("chat_messages").delete()
            .eq("conversation_id", conv_id)
            .eq("owner", owner_id)
            .execute()
        )
        deleted_msgs = len(res_messages.data or [])
        print(f"🗑️ Deleted {deleted_msgs} messages for conversation {conv_id}")
    except Exception as e:
        # Don't fail the whole deletion if message cleanup errors; continue to try deleting conversation
        print(f"⚠️ Failed deleting messages for {conv_id}: {e}")

    # 2) Delete the conversation row (owner filter)
    res_conv = (
        supabase.table("conversations").delete()
        .eq("id", conv_id).eq("owner", owner_id).execute()
    )
    deleted_conv = len(res_conv.data or [])
    ok = deleted_conv > 0
    if ok:
        print(f"✅ Deleted conversation {conv_id} for owner {owner_id}")
    return {"ok": ok, "deleted_messages": deleted_msgs, "deleted_conversations": deleted_conv}

async def append_message(conv_id: str, owner_id: str, role: str, content: str, agent_id: Optional[str] = None, tool_used: Optional[str] = None) -> Dict[str, Any]:
    """Append a chat message to chat_messages.
    role: 'user' | 'assistant' | 'agent'
    Also: if this is the first user message in the conversation, auto-title the conversation using
    a cleaned/truncated snippet of the message (server-side, so clients don't need extra calls).
    """
    payload = {
        "conversation_id": conv_id,
        "owner": owner_id,
        "role": role,
        "content": content,
        "agent_id": agent_id,
        "tool_used": tool_used,
    }
    res = supabase.table("chat_messages").insert(payload).execute()
    row = res.data[0]

    # Auto-title on first user message
    try:
        if role == "user":
            # Count messages for this conversation (owner-scoped). We only need first two.
            count_res = (
                supabase.table("chat_messages").select("id")
                .eq("conversation_id", conv_id)
                .eq("owner", owner_id)
                .limit(2)
                .execute()
            )
            total_msgs = len(count_res.data or [])
            if total_msgs == 1:
                cleaned = " ".join((content or "").strip().split())
                title = cleaned[:120] if cleaned else f"Chat • {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"

                # Only set title if currently null/empty to avoid overwriting user edits
                current = (
                    supabase.table("conversations").select("title")
                    .eq("id", conv_id).eq("owner", owner_id).limit(1).execute()
                )
                current_title = (current.data[0]["title"] if current and getattr(current, "data", None) else None)
                # Overwrite only if empty or clearly a placeholder like "New Chat" or auto-numbered "Chat N"
                placeholder = False
                if not current_title or not str(current_title).strip():
                    placeholder = True
                else:
                    ct = str(current_title).strip()
                    if ct.lower() in ("new chat", "untitled", "new chat · draft") or ct.startswith("Chat "):
                        placeholder = True
                if placeholder:
                    supabase.table("conversations").update({"title": title}).eq("id", conv_id).eq("owner", owner_id).execute()
                    print(f"📝 Auto-titled conversation {conv_id}: {title}")
    except Exception as e:
        # Do not fail message append if titling has issues
        print(f"⚠️ Auto-title failed for conversation {conv_id}: {e}")

    return row

async def list_messages(conv_id: str, owner_id: str, limit: int = 200) -> List[Dict[str, Any]]:
    res = (
        supabase.table("chat_messages").select("*")
        .eq("conversation_id", conv_id).eq("owner", owner_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return res.data or []
