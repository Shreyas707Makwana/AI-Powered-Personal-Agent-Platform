import os
import sys
from pathlib import Path

def debug_environment():
    print("🔍 Debugging Environment Configuration")
    print("=" * 50)
    
    # Current working directory
    print(f"\n📁 Current working directory: {os.getcwd()}")
    
    # Check if .env file exists
    env_file = Path('.env')
    if env_file.exists():
        print(f"✅ .env file found: {env_file.absolute()}")
        
        # Read and display .env content (without sensitive data)
        try:
            with open('.env', 'r') as f:
                lines = f.readlines()
                print(f"   📄 .env file has {len(lines)} lines")
                
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        if 'KEY' in line or 'PASSWORD' in line or 'SECRET' in line:
                            # Hide sensitive data
                            if '=' in line:
                                key, value = line.split('=', 1)
                                if value:
                                    print(f"   🔑 {key}=***{value[-4:] if len(value) > 4 else '***'}")
                                else:
                                    print(f"   ⚠️  {key}= (empty)")
                            else:
                                print(f"   📝 {line}")
                        else:
                            print(f"   📝 {line}")
        except Exception as e:
            print(f"   ❌ Error reading .env: {e}")
    else:
        print(f"❌ .env file not found in {env_file.absolute()}")
    
    # Check environment variables
    print(f"\n🌍 Environment Variables:")
    important_vars = [
        'HF_API_KEY', 'HUGGINGFACE_API_KEY', 'ENVIRONMENT',
        'DATABASE_URL', 'REDIS_URL', 'SUPABASE_URL'
    ]
    
    for var in important_vars:
        value = os.getenv(var)
        if value:
            if 'KEY' in var or 'PASSWORD' in var or 'SECRET' in var:
                print(f"   ✅ {var}: ***{value[-4:] if len(value) > 4 else '***'}")
            else:
                print(f"   ✅ {var}: {value}")
        else:
            print(f"   ❌ {var}: not set")
    
    # Check Python path
    print(f"\n🐍 Python Path:")
    print(f"   Executable: {sys.executable}")
    print(f"   Version: {sys.version}")
    
    # Check if virtual environment is active
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print(f"   ✅ Virtual environment active: {sys.prefix}")
    else:
        print(f"   ⚠️  No virtual environment detected")
    
    # Check for common issues
    print(f"\n🔍 Common Issues Check:")
    
    # Check if .env is in gitignore
    gitignore_file = Path('.gitignore')
    if gitignore_file.exists():
        with open('.gitignore', 'r') as f:
            content = f.read()
            if '.env' in content:
                print("   ✅ .env is in .gitignore (good for security)")
            else:
                print("   ⚠️  .env is NOT in .gitignore (security risk)")
    else:
        print("   ⚠️  .gitignore file not found")
    
    # Check if HF_API_KEY starts with 'hf_'
    hf_key = os.getenv("HF_API_KEY")
    if hf_key:
        if hf_key.startswith('hf_'):
            print("   ✅ HF_API_KEY format looks correct (starts with 'hf_')")
        else:
            print("   ❌ HF_API_KEY format incorrect (should start with 'hf_')")
    else:
        print("   ❌ HF_API_KEY not set")

if __name__ == "__main__":
    debug_environment()
