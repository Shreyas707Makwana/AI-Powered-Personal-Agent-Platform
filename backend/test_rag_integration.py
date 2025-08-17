#!/usr/bin/env python3
"""
Quick test script to verify RAG integration
Tests basic functionality without external dependencies
"""

import sys
import os

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all required modules can be imported"""
    print("🔍 Testing module imports...")
    
    try:
        from rag_search import load_embedding_model, embed_text, vector_to_pgvector_literal
        print("   ✅ rag_search module imported successfully")
        
        from main import app
        print("   ✅ main module imported successfully")
        
        from database import Document, DocumentChunk
        print("   ✅ database module imported successfully")
        
        from document_processor import DocumentProcessor
        print("   ✅ document_processor module imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"   ❌ Import failed: {str(e)}")
        return False

def test_rag_functions():
    """Test basic RAG function functionality"""
    print("\n🔍 Testing RAG functions...")
    
    try:
        from rag_search import vector_to_pgvector_literal
        
        # Test vector conversion
        test_vector = [1.0, 2.0, 3.0]
        result = vector_to_pgvector_literal(test_vector)
        expected = "[1.0,2.0,3.0]"
        
        if result == expected:
            print("   ✅ vector_to_pgvector_literal working correctly")
        else:
            print(f"   ❌ vector_to_pgvector_literal failed: expected {expected}, got {result}")
            return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ RAG function test failed: {str(e)}")
        return False

def test_app_endpoints():
    """Test that the FastAPI app has the expected endpoints"""
    print("\n🔍 Testing FastAPI endpoints...")
    
    try:
        from main import app
        
        # Check for required endpoints
        routes = [route.path for route in app.routes]
        required_endpoints = [
            "/",
            "/api/llm/chat",
            "/api/rag/ping",
            "/api/ingest/upload",
            "/api/ingest/search",
            "/api/ingest/documents"
        ]
        
        missing_endpoints = []
        for endpoint in required_endpoints:
            if endpoint not in routes:
                missing_endpoints.append(endpoint)
        
        if not missing_endpoints:
            print("   ✅ All required endpoints found")
            return True
        else:
            print(f"   ❌ Missing endpoints: {missing_endpoints}")
            return False
            
    except Exception as e:
        print(f"   ❌ Endpoint test failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing RAG Integration Setup")
    print("=" * 40)
    
    # Test imports
    imports_ok = test_imports()
    
    # Test RAG functions
    rag_ok = test_rag_functions()
    
    # Test app endpoints
    endpoints_ok = test_app_endpoints()
    
    # Summary
    print("\n" + "=" * 40)
    print("🎯 Test Summary:")
    print(f"   Module Imports: {'✅' if imports_ok else '❌'}")
    print(f"   RAG Functions: {'✅' if rag_ok else '❌'}")
    print(f"   API Endpoints: {'✅' if endpoints_ok else '❌'}")
    
    if all([imports_ok, rag_ok, endpoints_ok]):
        print("\n🎉 All tests passed! RAG integration is properly set up.")
        print("\n🚀 Next steps:")
        print("   1. Start your backend server: python main.py")
        print("   2. Test RAG ping: curl http://localhost:8000/api/rag/ping")
        print("   3. Test RAG chat: python test_rag_chat.py")
    else:
        print("\n⚠️ Some tests failed. Check the output above for details.")
        print("\n🔧 To fix issues:")
        print("   1. Ensure all dependencies are installed: pip install -r requirements.txt")
        print("   2. Check your .env file configuration")
        print("   3. Verify Supabase connection")

if __name__ == "__main__":
    main()
