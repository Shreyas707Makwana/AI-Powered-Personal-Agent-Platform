import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_models():
    print("🧪 Testing Different AI Models")
    print("=" * 35)
    
    # Get API key
    api_key = os.getenv("HF_API_KEY")
    if not api_key:
        print("❌ HF_API_KEY not found in environment variables")
        return
    
    print(f"✅ Found API key: {api_key[:10]}...")
    
    # Test different models
    models = [
        "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
        "microsoft/DialoGPT-medium",
        "gpt2"
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    for model in models:
        print(f"\n🧪 Testing model: {model}")
        
        try:
            # Test with a simple request
            payload = {
                "inputs": "Hello, how are you?",
                "parameters": {
                    "max_new_tokens": 50,
                    "temperature": 0.7
                }
            }
            
            # Try different API endpoints
            endpoints = [
                f"https://api-inference.huggingface.co/models/{model.split(':')[0]}",
                f"https://router.huggingface.co/v1/chat/completions"
            ]
            
            for endpoint in endpoints:
                try:
                    if "router.huggingface.co" in endpoint:
                        # Use OpenAI format for router API
                        router_payload = {
                            "model": model,
                            "messages": [{"role": "user", "content": "Hello, how are you?"}],
                            "max_tokens": 50
                        }
                        response = requests.post(endpoint, headers=headers, json=router_payload, timeout=30)
                    else:
                        response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
                    
                    print(f"   🌐 {endpoint}: {response.status_code}")
                    
                    if response.status_code == 200:
                        print(f"   ✅ Success with {endpoint}")
                        break
                    elif response.status_code == 503:
                        print(f"   ⏳ Model loading (503) - normal for free tier")
                    else:
                        print(f"   ❌ Failed: {response.text[:100]}")
                        
                except Exception as e:
                    print(f"   ❌ Error with {endpoint}: {str(e)}")
                    
        except Exception as e:
            print(f"   ❌ Error testing {model}: {str(e)}")
    
    print("\n🎯 Recommendation: Use the Hugging Face Router API for best results!")

if __name__ == "__main__":
    test_models()
