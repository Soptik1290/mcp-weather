
import asyncio
import sys
import os
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.server import get_aurora_forecast
from src.services import initialize_providers

async def test_aurora():
    print("Testing get_aurora_forecast MCP tool...")
    
    # Initialize providers (needed for search_location in the tool)
    # The tool uses the global 'providers' list in server.py
    # We need to ensure it's populated or mock it.
    # Since we are importing the function, we might need to initialize the server's providers or mock them.
    # In server.py:
    # providers_list = initialize_providers()
    # providers = [p[1] for p in providers_list]
    
    # We can't easily inject into the server module without some tricks or just running the server.
    # But since server.py runs initialize_providers() at module level, importing it might have already initialized them?
    # Let's check if providers are empty in server.py after import.
    
    import src.server as server_module
    
    if not server_module.providers:
        print("Initializing providers manually for test...")
        providers_list = initialize_providers()
        server_module.providers = [p[1] for p in providers_list]
    
    # Test 1: Known location
    try:
        result = await get_aurora_forecast("Tromso")
        data = json.loads(result)
        
        if "error" in data:
            print(f"[FAIL] Tromso returned error: {data['error']}")
        else:
            print(f"[PASS] Tromso: Kp={data.get('current_kp')}, Visibility={data.get('visibility_probability')}%")
            if data.get('forecast'):
                print(f"       Forecast len: {len(data['forecast'])}")
            
    except Exception as e:
        print(f"[FAIL] Exception testing Tromso: {e}")

    # Test 2: Low latitude location
    try:
        result = await get_aurora_forecast("Prague")
        data = json.loads(result)
        
        print(f"[PASS] Prague: Kp={data.get('current_kp')}, Visibility={data.get('visibility_probability')}%")
            
    except Exception as e:
        print(f"[FAIL] Exception testing Prague: {e}")

if __name__ == "__main__":
    asyncio.run(test_aurora())
