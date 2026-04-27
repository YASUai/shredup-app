#!/usr/bin/env python3
"""
Test script for SHRED UP Backend API
"""

import requests
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed")
            print(f"   Status: {data['status']}")
            print(f"   Libraries: {data.get('libraries', {})}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {BASE_URL}")
        print("   Make sure the server is running: python main.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_root():
    """Test root endpoint"""
    print("\n🔍 Testing root endpoint...")
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint working")
            print(f"   Service: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_analyze_with_files(user_audio: str, reference_audio: str):
    """Test analyze endpoint with real files"""
    print("\n🔍 Testing analyze endpoint with files...")
    
    user_path = Path(user_audio)
    ref_path = Path(reference_audio)
    
    if not user_path.exists():
        print(f"❌ User audio file not found: {user_audio}")
        return False
    
    if not ref_path.exists():
        print(f"❌ Reference audio file not found: {reference_audio}")
        return False
    
    try:
        with open(user_path, 'rb') as uf, open(ref_path, 'rb') as rf:
            files = {
                'user_audio': (user_path.name, uf, 'audio/mpeg'),
                'reference_audio': (ref_path.name, rf, 'audio/mpeg')
            }
            data = {
                'exercise_name': 'Test Exercise'
            }
            
            print(f"   Uploading files...")
            response = requests.post(
                f"{BASE_URL}/api/analyze-with-reference",
                files=files,
                data=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Analysis completed successfully")
                print(f"   Exercise: {result.get('exercise_name')}")
                
                if 'overall_score' in result:
                    score = result['overall_score']
                    print(f"   Overall Score: {score.get('total', 0):.1f}/100")
                    print(f"   Breakdown:")
                    for key, value in score.get('breakdown', {}).items():
                        print(f"     - {key.capitalize()}: {value:.1f}")
                
                return True
            else:
                print(f"❌ Analysis failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main test runner"""
    print("=" * 60)
    print("SHRED UP Backend API Tests")
    print("=" * 60)
    
    # Test health
    if not test_health():
        sys.exit(1)
    
    # Test root
    if not test_root():
        sys.exit(1)
    
    # Test with files if provided
    if len(sys.argv) >= 3:
        user_audio = sys.argv[1]
        reference_audio = sys.argv[2]
        if not test_analyze_with_files(user_audio, reference_audio):
            sys.exit(1)
    else:
        print("\n💡 To test analysis with files:")
        print("   python test_api.py <user_audio.mp3> <reference_audio.mp3>")
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
