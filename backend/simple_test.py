import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_env():
    print("🧪 Testing environment configuration...")
    
    # Check if .env file exists
    if os.path.exists('.env'):
        print("✅ .env file exists")
    else:
        print("❌ .env file not found")
        return
    
    # Check HF_API_KEY
    hf_key = os.getenv("HF_API_KEY")
    if hf_key:
        print(f"✅ HF_API_KEY found: {hf_key[:10]}...")
    else:
        print("❌ HF_API_KEY not found")
    
    # Check other important variables
    env_vars = ["ENVIRONMENT", "DATABASE_URL", "REDIS_URL"]
    for var in env_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {value}")
        else:
            print(f"⚠️  {var}: not set")

if __name__ == "__main__":
    test_env()
