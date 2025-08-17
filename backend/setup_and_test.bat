@echo off
echo 🚀 Setting up and testing AI Agent Platform...

echo.
echo 📦 Installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo.
echo 🔧 Setting up environment...
python setup_env.py

echo.
echo 🧪 Testing Hugging Face Router API...
python test_hf_router.py

echo.
echo 🎯 Starting backend server...
python main.py
