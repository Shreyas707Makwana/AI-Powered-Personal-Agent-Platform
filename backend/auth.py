"""
Authentication module for Supabase integration
Provides user validation and optional authentication dependencies
"""

import os
import requests
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency - returns user if authenticated, None otherwise
    """
    auth = request.headers.get("authorization")
    if not auth:
        return None
    
    try:
        token = auth.split(" ")[1]
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {token}"}
        r = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers, timeout=10)
        
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return r.json()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Required authentication dependency - raises 401 if not authenticated
    """
    auth = request.headers.get("authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        token = auth.split(" ")[1]
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {token}"}
        r = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers, timeout=10)
        
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = r.json()
        print(f" Authenticated user: {user.get('email')} (ID: {user.get('id')})")
        return {
            "id": user.get("id"),
            "email": user.get("email"),
            "full_name": user.get("user_metadata", {}).get("full_name")
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    except requests.RequestException as e:
        raise HTTPException(status_code=401, detail=f"Authentication service error: {str(e)}")

def get_optional_user(request: Request) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency - returns None if not authenticated
    Preserves demo/public functionality while enabling user-scoped features
    """
    try:
        return get_current_user(request)
    except HTTPException:
        # Return None for unauthenticated requests (demo mode)
        return None

# Convenience dependency for FastAPI injection
def optional_auth_dependency(request: Request) -> Optional[Dict[str, Any]]:
    """FastAPI dependency for optional authentication"""
    return get_optional_user(request)

def required_auth_dependency(request: Request) -> Dict[str, Any]:
    """FastAPI dependency for required authentication"""
    return get_current_user(request)
