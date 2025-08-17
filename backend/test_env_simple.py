import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    print("🔍 Simple Environment Test")
    print("=" * 25)
    
    # Check HF_API_KEY
    hf_key = os.getenv("HF_API_KEY")
    if hf_key:
        print(f"✅ HF_API_KEY found: {hf_key[:10]}...")
        print("🚀 You're ready to test the Hugging Face API!")
    else:
        print("❌ HF_API_KEY not found")
        print("💡 Run 'python setup_env.py' to configure your API key")
    
    # Check .env file
    if os.path.exists('.env'):
        print("✅ .env file exists")
    else:
        print("❌ .env file not found")

if __name__ == "__main__":
    main()
