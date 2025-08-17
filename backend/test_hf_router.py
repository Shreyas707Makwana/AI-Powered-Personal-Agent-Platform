import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_hf_router_api():
    print("🔍 Testing Hugging Face Router API with OpenAI client...")
    
    # Get API key
    api_key = os.getenv("HF_API_KEY")
    if not api_key:
        print("❌ HF_API_KEY not found in environment variables")
        return
    
    print(f"✅ Found API key: {api_key[:10]}...")
    
    # Initialize OpenAI client with Hugging Face Router API
    client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=api_key,
    )
    
    print("🚀 Testing with Mistral-7B-Instruct-v0.2...")
    
    try:
        # Test the exact same request that the backend makes
        completion = client.chat.completions.create(
            model="mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
            messages=[
                {
                    "role": "user",
                    "content": "Hello, how are you? What is the capital of France?"
                }
            ],
            max_tokens=100,
            temperature=0.7,
            top_p=0.95,
        )
        
        print("✅ Success! Response:")
        print(f"   Generated text: {completion.choices[0].message.content}")
        print(f"   Model used: {completion.model}")
        print(f"   Usage: {completion.usage}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = test_hf_router_api()
    if success:
        print("\n🎉 Hugging Face Router API is working!")
        print("You can now start your backend server!")
    else:
        print("\n❌ Hugging Face Router API test failed")
        print("Check your API key and try again")
