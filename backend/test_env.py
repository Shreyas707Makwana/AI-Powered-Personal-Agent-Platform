import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_env():
    print("🧪 Testing Environment Variables")
    print("=" * 30)
    
    # Test HF_API_KEY
    hf_key = os.getenv("HF_API_KEY")
    if hf_key:
        print(f"✅ HF_API_KEY: {hf_key[:10]}...")
    else:
        print("❌ HF_API_KEY not found")
    
    # Test other variables
    env_vars = ["ENVIRONMENT", "DATABASE_URL", "REDIS_URL"]
    for var in env_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {value}")
        else:
            print(f"⚠️  {var}: not set")

if __name__ == "__main__":
    test_env()
