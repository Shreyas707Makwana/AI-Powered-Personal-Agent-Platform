#!/usr/bin/env python3
"""
Integration tests for AI Agent Platform authentication system
Tests the complete flow from frontend auth to backend API calls
"""

import requests
import json
import os
from typing import Dict, Optional

# Configuration
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"

class AuthTestClient:
    def __init__(self):
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.user_id: Optional[str] = None
        
    def sign_up(self, email: str, password: str) -> bool:
        """Test user sign up via Supabase"""
        print(f"🔐 Testing sign up for {email}")
        # Note: This would typically be done through the frontend
        # For testing, you'd need to use Supabase client directly
        return True
        
    def sign_in(self, email: str, password: str) -> bool:
        """Test user sign in and token retrieval"""
        print(f"🔐 Testing sign in for {email}")
        # Note: This would typically be done through the frontend
        # For testing, you'd need to use Supabase client directly
        return True
        
    def test_me_endpoint(self) -> Dict:
        """Test /api/me endpoint"""
        print("👤 Testing /api/me endpoint")
        
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        response = self.session.get(f"{BACKEND_URL}/api/me", headers=headers)
        
        if response.status_code == 204:
            print("✅ Unauthenticated request returns 204")
            return {"authenticated": False}
        elif response.status_code == 200:
            user_data = response.json()
            print(f"✅ Authenticated user: {user_data}")
            return {"authenticated": True, "user": user_data}
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            return {"error": response.text}
    
    def test_upload_document(self, file_path: str) -> Dict:
        """Test document upload with authentication"""
        print(f"📄 Testing document upload: {file_path}")
        
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = self.session.post(
                f"{BACKEND_URL}/api/ingest/upload",
                files=files,
                headers=headers
            )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Document uploaded: {result}")
            return result
        else:
            print(f"❌ Upload failed: {response.status_code} - {response.text}")
            return {"error": response.text}
    
    def test_list_documents(self) -> Dict:
        """Test document listing with user scoping"""
        print("📋 Testing document listing")
        
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        response = self.session.get(
            f"{BACKEND_URL}/api/ingest/documents",
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Documents listed: {len(result.get('documents', []))} documents")
            return result
        else:
            print(f"❌ List failed: {response.status_code} - {response.text}")
            return {"error": response.text}
    
    def test_chat_with_rag(self, message: str, use_rag: bool = True) -> Dict:
        """Test chat with RAG using user's documents"""
        print(f"💬 Testing chat with RAG: {message}")
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        payload = {
            "messages": [{"role": "user", "content": message}],
            "use_rag": use_rag,
            "top_k": 3
        }
        
        response = self.session.post(
            f"{BACKEND_URL}/api/llm/chat",
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Chat response received with {len(result.get('citations', []))} citations")
            return result
        else:
            print(f"❌ Chat failed: {response.status_code} - {response.text}")
            return {"error": response.text}

def run_integration_tests():
    """Run complete integration test suite"""
    print("🚀 Starting AI Agent Platform Authentication Integration Tests")
    print("=" * 60)
    
    client = AuthTestClient()
    
    # Test 1: Unauthenticated access (demo mode)
    print("\n📋 Test 1: Unauthenticated Access (Demo Mode)")
    print("-" * 40)
    
    me_result = client.test_me_endpoint()
    assert not me_result.get("authenticated", True), "Should be unauthenticated"
    
    docs_result = client.test_list_documents()
    assert "documents" in docs_result, "Should return documents list"
    
    chat_result = client.test_chat_with_rag("Hello, how are you?", use_rag=False)
    assert "response" in chat_result, "Should return chat response"
    
    print("✅ Demo mode tests passed")
    
    # Test 2: Authenticated access (would require real Supabase setup)
    print("\n🔐 Test 2: Authenticated Access")
    print("-" * 40)
    print("⚠️  Note: Authenticated tests require manual setup with real Supabase credentials")
    print("   1. Sign up a test user in the frontend")
    print("   2. Extract the access token")
    print("   3. Set client.access_token and run authenticated tests")
    
    # Test 3: Document ownership verification
    print("\n📄 Test 3: Document Ownership")
    print("-" * 40)
    print("   This test would verify that:")
    print("   - Authenticated users only see their own documents")
    print("   - Unauthenticated users only see public documents")
    print("   - RAG search is scoped to user's documents when authenticated")
    
    print("\n🎉 Integration tests completed!")
    print("   For full testing, set up Supabase credentials and run with authentication")

if __name__ == "__main__":
    run_integration_tests()
