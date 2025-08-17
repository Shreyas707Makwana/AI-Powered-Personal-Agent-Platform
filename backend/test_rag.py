import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_rag_endpoints():
    """Test the RAG endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing RAG Endpoints")
    print("=" * 40)
    
    # Test 1: Health check
    print("\n1️⃣ Testing health check...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print("   ❌ Health check failed")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 2: List documents (should be empty initially)
    print("\n2️⃣ Testing list documents...")
    try:
        response = requests.get(f"{base_url}/api/ingest/documents")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Documents listed: {data.get('total', 0)} documents")
        else:
            print("   ❌ Failed to list documents")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 3: Test document search (should work even without documents)
    print("\n3️⃣ Testing document search...")
    try:
        search_data = {"query": "test query", "limit": 3}
        response = requests.post(f"{base_url}/api/ingest/search", json=search_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Search successful: {data.get('total_found', 0)} results")
        else:
            print("   ❌ Search failed")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 RAG Endpoints Test Complete!")
    print("💡 To test document upload, use:")
    print(f"   curl -X POST -F 'file=@sample.pdf' {base_url}/api/ingest/upload")

def test_document_upload():
    """Test document upload with a sample PDF"""
    base_url = "http://localhost:8000"
    
    print("\n📄 Testing Document Upload")
    print("=" * 40)
    
    # Check if sample.pdf exists
    sample_pdf = "sample.pdf"
    if not os.path.exists(sample_pdf):
        print(f"   ⚠️  {sample_pdf} not found. Create a sample PDF to test upload.")
        print("   💡 You can create a simple PDF with any text content.")
        return
    
    print(f"   📁 Found {sample_pdf}, testing upload...")
    
    try:
        with open(sample_pdf, 'rb') as f:
            files = {'file': (sample_pdf, f, 'application/pdf')}
            response = requests.post(f"{base_url}/api/ingest/upload", files=files)
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Upload successful!")
            print(f"   📄 Document ID: {data.get('document_id')}")
            print(f"   📊 Chunks processed: {data.get('chunks_processed')}")
            print(f"   📝 Status: {data.get('status')}")
        else:
            print(f"   ❌ Upload failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    test_rag_endpoints()
    test_document_upload()
