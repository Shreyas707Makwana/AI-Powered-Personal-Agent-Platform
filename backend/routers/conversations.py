from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from auth import required_auth_dependency
from database import (
    create_conversation,
    list_conversations,
    get_conversation,
    update_conversation,
    delete_conversation,
    list_messages,
    append_message,
)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = None


class ConversationUpdateRequest(BaseModel):
    title: Optional[str] = None
    archived: Optional[bool] = None


class MessageCreateRequest(BaseModel):
    role: str
    content: str
    agent_id: Optional[str] = None
    tool_used: Optional[str] = None


@router.post("/", response_model=Dict[str, Any])
async def create_conv(req: ConversationCreateRequest, user: Dict[str, Any] = Depends(required_auth_dependency)):
    try:
        conv = await create_conversation(owner_id=user["id"], title=req.title)
        return conv
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Dict[str, Any]])
async def list_convs(user: Dict[str, Any] = Depends(required_auth_dependency)):
    try:
        return await list_conversations(user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{conversation_id}", response_model=Dict[str, Any])
async def get_conv(conversation_id: str, user: Dict[str, Any] = Depends(required_auth_dependency)):
    conv = await get_conversation(conversation_id, user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.put("/{conversation_id}", response_model=Dict[str, Any])
async def update_conv(conversation_id: str, req: ConversationUpdateRequest, user: Dict[str, Any] = Depends(required_auth_dependency)):
    try:
        return await update_conversation(conversation_id, user["id"], **{k: v for k, v in req.dict().items() if v is not None})
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{conversation_id}")
async def delete_conv(conversation_id: str, user: Dict[str, Any] = Depends(required_auth_dependency)):
    result = await delete_conversation(conversation_id, user["id"])
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="Conversation not found or not owned by user")
    return result


@router.get("/{conversation_id}/messages", response_model=List[Dict[str, Any]])
async def get_messages(conversation_id: str, user: Dict[str, Any] = Depends(required_auth_dependency)):
    conv = await get_conversation(conversation_id, user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return await list_messages(conversation_id, user["id"])


@router.post("/{conversation_id}/messages", response_model=Dict[str, Any])
async def post_message(conversation_id: str, req: MessageCreateRequest, user: Dict[str, Any] = Depends(required_auth_dependency)):
    conv = await get_conversation(conversation_id, user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return await append_message(conversation_id, user["id"], req.role, req.content, agent_id=req.agent_id, tool_used=req.tool_used)
