#!/usr/bin/env python3
"""
Test script for RAG-enabled chat endpoint
Tests the /api/llm/chat endpoint with RAG functionality
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
API_ENDPOINT = f"{BASE_URL}/api/llm/chat"

def test_rag_ping():
    """Test the RAG ping endpoint"""
    print("🔍 Testing RAG ping endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/rag/ping")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ RAG ping successful: {data}")
            return data.get("ok", False)
        else:
            print(f"   ❌ RAG ping failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ RAG ping error: {str(e)}")
        return False

def test_regular_chat():
    """Test regular chat without RAG"""
    print("\n💬 Testing regular chat (no RAG)...")
    
    payload = {
        "messages": [
            {"role": "user", "content": "Hello! What is the capital of France?"}
        ],
        "use_rag": False
    }
    
    try:
        response = requests.post(API_ENDPOINT, json=payload)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Regular chat successful")
            print(f"   📝 Response: {data['response'][:100]}...")
            print(f"   📊 Citations: {data.get('citations', 'None')}")
            return True
        else:
            print(f"   ❌ Regular chat failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Regular chat error: {str(e)}")
        return False

def test_rag_chat():
    """Test chat with RAG enabled"""
    print("\n🔍 Testing RAG-enabled chat...")
    
    payload = {
        "messages": [
            {"role": "user", "content": "What is this document about?"}
        ],
        "use_rag": True,
        "top_k": 3
    }
    
    try:
        response = requests.post(API_ENDPOINT, json=payload)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ RAG chat successful")
            print(f"   📝 Response: {data['response'][:100]}...")
            
            if data.get('citations'):
                print(f"   📚 Citations found: {len(data['citations'])}")
                for i, citation in enumerate(data['citations']):
                    print(f"      {i+1}. Doc {citation['document_id']}, Chunk {citation['chunk_index']}, Similarity: {citation['similarity']:.3f}")
                    print(f"         Snippet: {citation['snippet'][:80]}...")
            else:
                print(f"   📊 Citations: None")
            
            return True
        else:
            print(f"   ❌ RAG chat failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ RAG chat error: {str(e)}")
        return False

def test_rag_chat_with_document_filter():
    """Test RAG chat with specific document filter"""
    print("\n📄 Testing RAG chat with document filter...")
    
    # First, get list of documents to use a valid document_id
    try:
        docs_response = requests.get(f"{BASE_URL}/api/ingest/documents")
        if docs_response.status_code == 200:
            docs_data = docs_response.json()
            if docs_data.get("documents"):
                document_id = docs_data["documents"][0]["id"]
                
                payload = {
                    "messages": [
                        {"role": "user", "content": "Tell me about the content in this specific document"}
                    ],
                    "use_rag": True,
                    "top_k": 2,
                    "document_id": str(document_id)
                }
                
                response = requests.post(API_ENDPOINT, json=payload)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   ✅ Document-filtered RAG chat successful")
                    print(f"   📝 Response: {data['response'][:100]}...")
                    
                    if data.get('citations'):
                        print(f"   📚 Citations found: {len(data['citations'])}")
                        for citation in data['citations']:
                            print(f"      - Doc {citation['document_id']}, Chunk {citation['chunk_index']}, Similarity: {citation['similarity']:.3f}")
                    
                    return True
                else:
                    print(f"   ❌ Document-filtered RAG chat failed: {response.text}")
                    return False
            else:
                print("   ⚠️ No documents found, skipping document filter test")
                return True
        else:
            print("   ⚠️ Could not fetch documents, skipping document filter test")
            return True
            
    except Exception as e:
        print(f"   ❌ Document filter test error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing RAG-Enabled Chat Endpoints")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Test RAG ping
    rag_ok = test_rag_ping()
    
    if not rag_ok:
        print("\n❌ RAG system is not ready. Please check:")
        print("   1. Embedding model is loaded")
        print("   2. Database connection is working")
        print("   3. Server is running")
        return
    
    # Test regular chat
    regular_ok = test_regular_chat()
    
    # Test RAG chat
    rag_chat_ok = test_rag_chat()
    
    # Test RAG chat with document filter
    filter_ok = test_rag_chat_with_document_filter()
    
    # Summary
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print(f"   RAG Ping: {'✅' if rag_ok else '❌'}")
    print(f"   Regular Chat: {'✅' if regular_ok else '❌'}")
    print(f"   RAG Chat: {'✅' if rag_chat_ok else '❌'}")
    print(f"   Document Filter: {'✅' if filter_ok else '❌'}")
    
    if all([rag_ok, regular_ok, rag_chat_ok, filter_ok]):
        print("\n🎉 All tests passed! RAG integration is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
