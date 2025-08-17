import os

def setup_env():
    print("🔧 Setting up environment variables...")
    
    # Check if .env exists
    if os.path.exists('.env'):
        print("📄 .env file already exists")
        with open('.env', 'r') as f:
            content = f.read()
            if 'HF_API_KEY' in content and 'your_huggingface_api_key_here' not in content:
                print("✅ HF_API_KEY appears to be configured")
                return
            else:
                print("⚠️  HF_API_KEY needs to be configured")
    else:
        print("📄 Creating new .env file")
    
    # Get API key from user
    print("\n🔑 Please enter your Hugging Face API key:")
    print("   (Get it from: https://huggingface.co/settings/tokens)")
    print("   (It should start with 'hf_')")
    
    api_key = input("HF_API_KEY: ").strip()
    
    if not api_key.startswith('hf_'):
        print("❌ Invalid API key format. It should start with 'hf_'")
        return
    
    # Create or update .env file
    env_content = f"""# Environment Configuration
ENVIRONMENT=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_KEY=your_supabase_anon_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_agent_platform

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Hugging Face Configuration
HUGGINGFACE_API_KEY={api_key}
HF_API_KEY={api_key}

# RAG Configuration
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.vercel.app
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env file configured successfully!")
    print("🚀 You can now restart your backend server and test the chat endpoint")

if __name__ == "__main__":
    setup_env()
