import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def test_flow():
    async with httpx.AsyncClient() as client:
        print("1. Creating Workspace...")
        ws_res = await client.post(f"{BASE_URL}/workspaces/", json={"name": "Test Workspace", "slug": "test-ws"})
        ws_res.raise_for_status()
        ws_uuid = ws_res.json()["uuid"]
        print(f"Workspace created: {ws_uuid}")

        print("2. Creating Project...")
        proj_res = await client.post(f"{BASE_URL}/projects/", json={"name": "Test Project", "workspace_uuid": ws_uuid})
        proj_res.raise_for_status()
        proj_uuid = proj_res.json()["uuid"]
        print(f"Project created: {proj_uuid}")

        print("3. Creating Blueprint...")
        bp_payload = {
            "project_uuid": proj_uuid,
            "version": 1,
            "content": {
                "pages": [],
                "theme": {},
                "settings": {}
            }
        }
        bp_res = await client.post(f"{BASE_URL}/blueprints/", json=bp_payload)
        bp_res.raise_for_status()
        bp_uuid = bp_res.json()["uuid"]
        print(f"Blueprint created: {bp_uuid}")

        print("4. Modifying Blueprint...")
        bp_update = {
            "version": 2,
            "content": {
                "pages": [{"name": "Home", "slug": "home", "path": "/"}],
                "theme": {"colors": {"primary": "blue"}},
                "settings": {}
            }
        }
        bp_upd_res = await client.put(f"{BASE_URL}/blueprints/{bp_uuid}", json=bp_update)
        bp_upd_res.raise_for_status()
        print(f"Blueprint modified, new version: {bp_upd_res.json()['version']}")

        print("5. Reading Blueprint...")
        bp_get_res = await client.get(f"{BASE_URL}/blueprints/{bp_uuid}")
        bp_get_res.raise_for_status()
        print(f"Blueprint read successfully: {json.dumps(bp_get_res.json()['content'])}")

        print("6. Deleting Workspace (Cascade test)...")
        del_res = await client.delete(f"{BASE_URL}/workspaces/{ws_uuid}")
        del_res.raise_for_status()
        
        # Verify cascade
        bp_check = await client.get(f"{BASE_URL}/blueprints/{bp_uuid}")
        if bp_check.status_code == 404:
            print("Cascade delete successful! Blueprint no longer exists.")
        else:
            print("Cascade delete failed!")

        print("7. Testing Error Cases (Validation)...")
        print("Testing duplicate UUIDs rejection...")
        
        # Re-create a workspace and project just for the error test
        ws_err_res = await client.post(f"{BASE_URL}/workspaces/", json={"name": "Err WS", "slug": "err-ws-uuid-test"})
        ws_err_id = ws_err_res.json()["uuid"]
        proj_err_res = await client.post(f"{BASE_URL}/projects/", json={"name": "Err Proj", "workspace_uuid": ws_err_id})
        
        bad_bp_payload = {
            "project_uuid": proj_err_res.json()["uuid"],
            "version": 1,
            "content": {
                "pages": [
                    {
                        "uuid": "dup-1234",
                        "name": "Page 1",
                        "slug": "page-1",
                        "path": "/p1"
                    },
                    {
                        "uuid": "dup-1234",
                        "name": "Page 2",
                        "slug": "page-2",
                        "path": "/p2"
                    }
                ]
            }
        }

        err_res = await client.post(f"{BASE_URL}/blueprints/", json=bad_bp_payload)
        if err_res.status_code == 422:
            print(f"Validation successfully blocked invalid data! Error: {err_res.json()['detail'][0]['msg']}")
        else:
            print(f"Validation failed to block data! Status: {err_res.status_code}")

        # Clean up
        await client.delete(f"{BASE_URL}/workspaces/{ws_err_id}")

if __name__ == "__main__":
    asyncio.run(test_flow())
