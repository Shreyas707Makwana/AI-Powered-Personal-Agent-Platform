from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from auth import required_auth_dependency
from database import create_agent, update_agent, delete_agent, list_agents, get_agent

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Request/Response Models
class CreateAgentRequest(BaseModel):
    name: str
    instructions: str
    avatar_url: Optional[str] = None
    is_default: Optional[bool] = False

class UpdateAgentRequest(BaseModel):
    name: Optional[str] = None
    instructions: Optional[str] = None
    avatar_url: Optional[str] = None
    is_default: Optional[bool] = None

class AgentResponse(BaseModel):
    id: str
    owner: str
    name: str
    avatar_url: Optional[str]
    instructions: str
    is_default: bool
    created_at: str
    updated_at: str

@router.post("/", response_model=AgentResponse)
async def create_new_agent(
    request: CreateAgentRequest,
    user: Dict[str, Any] = Depends(required_auth_dependency)
):
    """Create a new agent for the authenticated user"""
    try:
        agent = await create_agent(
            owner_id=user["id"],
            name=request.name,
            instructions=request.instructions,
            avatar_url=request.avatar_url,
            is_default=request.is_default or False
        )
        return AgentResponse(**agent)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating agent: {str(e)}")

@router.get("/", response_model=List[AgentResponse])
async def list_user_agents(
    user: Dict[str, Any] = Depends(required_auth_dependency)
):
    """List all agents for the authenticated user"""
    try:
        agents = await list_agents(user["id"])
        return [AgentResponse(**agent) for agent in agents]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing agents: {str(e)}")

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent_details(
    agent_id: str,
    user: Dict[str, Any] = Depends(required_auth_dependency)
):
    """Get details of a specific agent (only owner can access)"""
    try:
        agent = await get_agent(agent_id, user["id"])
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return AgentResponse(**agent)
    except ValueError:
        raise HTTPException(status_code=404, detail="Agent not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving agent: {str(e)}")

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_existing_agent(
    agent_id: str,
    request: UpdateAgentRequest,
    user: Dict[str, Any] = Depends(required_auth_dependency)
):
    """Update an agent (only owner can update)"""
    try:
        # Filter out None values from the request
        update_fields = {k: v for k, v in request.dict().items() if v is not None}
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        agent = await update_agent(agent_id, user["id"], **update_fields)
        return AgentResponse(**agent)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating agent: {str(e)}")

@router.delete("/{agent_id}")
async def delete_existing_agent(
    agent_id: str,
    user: Dict[str, Any] = Depends(required_auth_dependency)
):
    """Delete an agent (only owner can delete)"""
    try:
        success = await delete_agent(agent_id, user["id"])
        if not success:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"message": "Agent deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting agent: {str(e)}")
