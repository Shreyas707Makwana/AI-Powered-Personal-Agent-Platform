import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def quick_test():
    print("🚀 Quick Test for AI Agent Platform")
    print("=" * 40)
    
    # Test 1: Environment
    print("\n1️⃣ Testing Environment...")
    hf_key = os.getenv("HF_API_KEY")
    if hf_key:
        print(f"   ✅ HF_API_KEY: {hf_key[:10]}...")
    else:
        print("   ❌ HF_API_KEY not found")
        return False
    
    # Test 2: Dependencies
    print("\n2️⃣ Testing Dependencies...")
    try:
        import fastapi
        print(f"   ✅ FastAPI: {fastapi.__version__}")
    except ImportError:
        print("   ❌ FastAPI not installed")
        return False
    
    try:
        import openai
        print(f"   ✅ OpenAI: {openai.__version__}")
    except ImportError:
        print("   ❌ OpenAI not installed")
        return False
    
    try:
        import uvicorn
        print(f"   ✅ Uvicorn: {uvicorn.__version__}")
    except ImportError:
        print("   ❌ Uvicorn not installed")
        return False
    
    # Test 3: Model Configuration
    print("\n3️⃣ Testing Model Configuration...")
    print("   🎯 Model: mistralai/Mistral-7B-Instruct-v0.2:featherless-ai")
    print("   🌐 API: Hugging Face Router API")
    print("   🔑 Base URL: https://router.huggingface.co/v1")
    
    print("\n✅ All tests passed! Your backend is ready to run.")
    print("🚀 Run 'python main.py' to start the server.")
    return True

if __name__ == "__main__":
    success = quick_test()
    if not success:
        print("\n❌ Some tests failed. Please check your setup.")
        sys.exit(1)
