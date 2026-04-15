import requests
import uuid

BASE_URL = "http://localhost:8080/"
TIMEOUT = 30

# Use a tenant admin user to authenticate and get token
def authenticate_admin():
    # This function should be adapted to your auth RPC or endpoint
    # Here we simulate a sign-in RPC call to auth.users returning access_token and user info
    url = f"{BASE_URL}rpc/auth.users"
    payload = {
        "email": "tenantadmin@example.com",
        "password": "tenantadminpassword"
    }
    headers = {"Content-Type": "application/json"}
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except Exception as e:
        raise RuntimeError(f"Authentication RPC request failed: {e}")
    if resp.status_code != 201 and resp.status_code != 200:
        raise RuntimeError(f"Authentication failed: status code {resp.status_code}, response: {resp.text}")
    data = resp.json()
    if "access_token" not in data:
        raise RuntimeError("Authentication failed: No access_token returned")
    return data["access_token"]

def test_client_management_crud_operations():
    admin_token = authenticate_admin()
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }

    clients_url = f"{BASE_URL}rest/v1/public.clientes"

    created_client_id = None
    try:
        # 1. INSERT a new client (Create)
        new_client_payload = {
            "name": f"Test Client {uuid.uuid4()}",
            "contact": "testclient@example.com",
            # tenant_id should be inferred from token by RLS, so often omitted or included explicitly if needed
        }
        resp = requests.post(clients_url, json=new_client_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}: {resp.text}"
        created_client = resp.json()
        # Insert endpoint with PostgREST usually returns inserted rows as an array
        assert isinstance(created_client, list) and len(created_client) > 0, "No client created data returned"
        created_client_id = created_client[0].get("id") or created_client[0].get("client_id")
        assert created_client_id is not None, "Created client ID missing"

        # 2. SELECT clients (Read) - expect to find the created client, scoped by tenant
        resp = requests.get(clients_url, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 OK on client list, got {resp.status_code}: {resp.text}"
        clients_list = resp.json()
        assert any(c.get("id", c.get("client_id")) == created_client_id for c in clients_list), "Created client not found in list"

        # 3. UPDATE the created client (update notes)
        updated_notes = "Updated notes for client"
        update_payload = {
            "notes": updated_notes
        }
        update_url = f"{clients_url}?id=eq.{created_client_id}"
        resp = requests.patch(update_url, json=update_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 OK on update, got {resp.status_code}: {resp.text}"
        updated_client = resp.json()
        assert isinstance(updated_client, list) and len(updated_client) > 0, "No client updated data returned"
        assert updated_client[0].get("notes") == updated_notes, "Client notes not updated correctly"

        # 4. DELETE the created client
        delete_url = f"{clients_url}?id=eq.{created_client_id}"
        resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 204, f"Expected 204 No Content on delete, got {resp.status_code}: {resp.text}"

        # Verify the client no longer exists
        resp = requests.get(f"{clients_url}?id=eq.{created_client_id}", headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 OK on client get after delete, got {resp.status_code}: {resp.text}"
        post_delete_data = resp.json()
        assert len(post_delete_data) == 0, "Deleted client still found in list"

        # 5. DELETE non-existent client (should return 404)
        resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 404, f"Expected 404 Not Found when deleting non-existent client, got {resp.status_code}"

        # 6. Access clients with invalid/expired token (401/403 expected)
        invalid_headers = {
            "Authorization": "Bearer invalidtoken",
            "Content-Type": "application/json"
        }
        resp = requests.get(clients_url, headers=invalid_headers, timeout=TIMEOUT)
        assert resp.status_code in (401, 403), f"Expected 401/403 Unauthorized with invalid token, got {resp.status_code}"

        # 7. Tenant isolation - attempt to access clients of other tenant by filtering (simulate)
        # As RLS enforces isolation, trying to filter by another tenant_id should return 403 or empty result.
        # Assuming the client structure contains 'tenant_id' field and accessible by token.
        other_tenant_id = str(uuid.uuid4())
        filter_url = f"{clients_url}?tenant_id=eq.{other_tenant_id}"
        resp = requests.get(filter_url, headers=headers, timeout=TIMEOUT)
        # Expected either 403 Forbidden or empty list (depending on RLS setup)
        assert resp.status_code in (200, 403), f"Unexpected status code for cross-tenant access: {resp.status_code}"
        if resp.status_code == 200:
            data = resp.json()
            assert isinstance(data, list), "Response data not a list"
            assert len(data) == 0, "Cross-tenant data leakage: received clients for other tenant"

    finally:
        # Cleanup - ensure the created client is deleted if it still exists
        if created_client_id is not None:
            try:
                requests.delete(f"{clients_url}?id=eq.{created_client_id}", headers=headers, timeout=TIMEOUT)
            except Exception:
                pass

test_client_management_crud_operations()
