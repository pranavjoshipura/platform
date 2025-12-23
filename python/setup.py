#!/usr/bin/env python3
"""
Setup script for Agentic AI Workshop
Handles dependencies and initial configuration
"""

import os
import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Check if Python version is 3.10 or higher"""
    if sys.version_info < (3, 10):
        print("❌ Python 3.10 or higher is required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")


def install_dependencies():
    """Install required Python packages"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], check=True)
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)


def create_directories():
    """Create necessary directories"""
    directories = [
        "outputs",
        "outputs/diagnostics",
        "outputs/quality-gates",
        "outputs/multi-agent",
        "outputs/portal",
        "outputs/templates",
        "data",
        "logs"
    ]
    
    print("\n📁 Creating directories...")
    for dir_path in directories:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    print("✅ Directories created")


def setup_environment():
    """Set up environment configuration"""
    print("\n🔧 Setting up environment...")
    
    if not Path(".env").exists() and Path(".env.example").exists():
        import shutil
        shutil.copy(".env.example", ".env")
        print("✅ Created .env file from .env.example")
        print("   ⚠️  Please edit .env with your API keys (optional)")
    else:
        print("ℹ️  .env file already exists")
    
    # Set default to mock mode if no API keys
    os.environ.setdefault("USE_MOCK_AI", "true")
    print("✅ Mock mode enabled by default (no API key required)")


def test_import():
    """Test that the workshop modules can be imported"""
    print("\n🧪 Testing imports...")
    try:
        # Test importing the AI client
        sys.path.insert(0, str(Path.cwd()))
        from ai_client import AIClient
        print("✅ AI client module loaded successfully")
        
        # Test creating a client in mock mode
        os.environ["USE_MOCK_AI"] = "true"
        client = AIClient()
        print("✅ Mock AI client initialized successfully")
        
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False


def main():
    """Main setup function"""
    print("=" * 50)
    print("🚀 Agentic AI Workshop Setup")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Install dependencies
    install_dependencies()
    
    # Create directories
    create_directories()
    
    # Setup environment
    setup_environment()
    
    # Test imports
    if test_import():
        print("\n" + "=" * 50)
        print("✅ Setup completed successfully!")
        print("=" * 50)
        print("\n📝 Next steps:")
        print("1. (Optional) Edit .env to add your API keys")
        print("2. Try the exercises:")
        print("   python exercises/ex1_diagnostic_agent.py --mode interactive")
        print("   python exercises/ex2_quality_gates.py --simulate good")
        print("   python exercises/ex3_multi_agent.py --scenario balanced")
        print("\n💡 Tip: All exercises work in mock mode without API keys!")
    else:
        print("\n❌ Setup completed with errors")
        print("   Please check the error messages above")


if __name__ == "__main__":
    main()
