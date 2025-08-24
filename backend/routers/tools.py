from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from auth import required_auth_dependency
from database import (
    list_tools as db_list_tools,
    list_agent_tools as db_list_agent_tools,
    upsert_agent_tool as db_upsert_agent_tool,
    is_tool_enabled as db_is_tool_enabled,
    insert_tool_log,
)
from tools.weather import fetch_weather, WeatherToolError
from tools.news import fetch_news, NewsToolError, check_rate_limit

router = APIRouter(prefix="/api", tags=["tools"])


class ExecuteToolRequest(BaseModel):
    agent_id: Optional[str] = None
    tool_key: str
    params: Dict[str, Any] = {}

class ExecuteToolResponse(BaseModel):
    success: bool
    result: Dict[str, Any]


@router.get("/tools")
async def list_tools() -> List[Dict[str, Any]]:
    """List available tools (public)."""
    return await db_list_tools()  # type: ignore


@router.post("/tools/execute", response_model=ExecuteToolResponse)
async def execute_tool(req: ExecuteToolRequest, user: Dict[str, Any] = Depends(required_auth_dependency)):
    """Execute a server-side tool. If agent_id provided, verify ownership and enablement."""
    # If agent_id provided, ensure the tool is enabled for that agent for this user
    if req.agent_id:
        enabled = await db_is_tool_enabled(req.agent_id, user["id"], req.tool_key)
        if not enabled:
            raise HTTPException(status_code=403, detail="Tool not enabled for this agent")

    # Basic validation by tool_key and dispatch
    result: Dict[str, Any]
    try:
        if req.tool_key == "weather":
            result = await fetch_weather(req.params)
        elif req.tool_key == "news":
            # Per-user simple rate-limit: 5 calls/minute
            check_rate_limit(user.get("id"))
            result = await fetch_news(req.params)
        else:
            raise HTTPException(status_code=400, detail="Unsupported tool_key")
    except WeatherToolError as e:
        # Log failure too
        await insert_tool_log(req.agent_id, user.get("id"), req.tool_key, req.params, {"error": str(e)})
        raise HTTPException(status_code=400, detail=str(e))
    except NewsToolError as e:
        await insert_tool_log(req.agent_id, user.get("id"), req.tool_key, req.params, {"error": str(e)})
        msg = str(e)
        if "Rate limit exceeded" in msg:
            raise HTTPException(status_code=429, detail=msg)
        raise HTTPException(status_code=400, detail=msg)

    # Log success
    await insert_tool_log(req.agent_id, user.get("id"), req.tool_key, req.params, result)

    return {"success": True, "result": result}


@router.get("/agents/{agent_id}/tools")
async def list_agent_tools(agent_id: str, user: Dict[str, Any] = Depends(required_auth_dependency)):
    """List agent tool enablement (owner-only via DB helper)."""
    try:
        return await db_list_agent_tools(agent_id, user["id"])  # type: ignore
    except ValueError:
        raise HTTPException(status_code=404, detail="Agent not found")


# -----------------------------
# Internal helper (server-side only)
# -----------------------------
async def execute_tool_internal(user_id: Optional[str], agent_id: Optional[str], tool_key: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool internally (bypassing HTTP and auth dependency). Validates agent enablement only if agent_id is provided.
    Returns the tool result dict. Raises HTTPException on validation failure.
    """
    if agent_id and user_id:
        enabled = await db_is_tool_enabled(agent_id, user_id, tool_key)
        if not enabled:
            raise HTTPException(status_code=403, detail="Tool not enabled for this agent")

    try:
        if tool_key == "weather":
            result = await fetch_weather(params)
        elif tool_key == "news":
            # Apply rate limit if we have a user id
            if user_id:
                check_rate_limit(user_id)
            result = await fetch_news(params)
        else:
            raise HTTPException(status_code=400, detail="Unsupported tool_key")
    except WeatherToolError as e:
        await insert_tool_log(agent_id, user_id, tool_key, params, {"error": str(e)})
        raise HTTPException(status_code=400, detail=str(e))
    except NewsToolError as e:
        await insert_tool_log(agent_id, user_id, tool_key, params, {"error": str(e)})
        msg = str(e)
        if "Rate limit exceeded" in msg:
            raise HTTPException(status_code=429, detail=msg)
        raise HTTPException(status_code=400, detail=msg)

    await insert_tool_log(agent_id, user_id, tool_key, params, result)
    return result


class UpdateAgentToolRequest(BaseModel):
    enabled: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


@router.put("/agents/{agent_id}/tools/{tool_key}")
async def update_agent_tool(agent_id: str, tool_key: str, req: UpdateAgentToolRequest, user: Dict[str, Any] = Depends(required_auth_dependency)):
    """Enable/disable/configure tool per agent (owner-only)."""
    try:
        row = await db_upsert_agent_tool(agent_id, user["id"], tool_key, enabled=req.enabled, config=req.config)
        return row
    except ValueError:
        raise HTTPException(status_code=404, detail="Agent not found")
