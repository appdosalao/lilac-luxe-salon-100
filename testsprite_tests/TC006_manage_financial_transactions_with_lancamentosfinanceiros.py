import requests
import uuid

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

# These credentials should be replaced with valid tenant admin credentials for testing
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "secure_password"

def authenticate(email: str, password: str):
    """
    Authenticate via RPC auth.users sign-in and return the access_token and user_id.
    """
    url = f"{BASE_URL}/rpc/auth.users"
    payload = {
        "email": email,
        "password": password,
        "action": "sign-in"
    }
    headers = {"Content-Type": "application/json"}
    resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    assert "session" in data and "access_token" in data["session"], "Authentication token missing"
    token = data["session"]["access_token"]
    user_id = data["user"]["id"]
    return token, user_id

def test_tc006_manage_financial_transactions_with_lancamentosfinanceiros():
    # 1) Authenticate as tenant admin user
    try:
        token, user_id = authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)
    except requests.HTTPError as e:
        assert False, f"Authentication failed: {e}"

    headers_auth = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    headers_no_auth = {
        "Content-Type": "application/json"
    }

    # Helper function to create lancamento financeiro record
    def create_financial_transaction(transaction_data):
        url = f"{BASE_URL}/rest/v1/public.lancamentos_financeiros"
        response = requests.post(url, json=transaction_data, headers=headers_auth, timeout=TIMEOUT)
        return response

    # Helper function to delete lancamento financeiro record by id
    def delete_financial_transaction(record_id):
        url = f"{BASE_URL}/rest/v1/public.lancamentos_financeiros?id=eq.{record_id}"
        response = requests.delete(url, headers=headers_auth, timeout=TIMEOUT)
        return response

    # -------------------------------------------------------------------------
    # Step 1: Attempt to create a valid financial transaction (type: income)
    valid_transaction = {
        "type": "income",
        "amount": 1500.75,
        "date": "2026-04-01",
        "description": "Test income transaction",
        "tenant_id": user_id  # Use user_id as tenant_id to simulate tenant isolation
    }

    record_id = None
    try:
        resp = create_financial_transaction(valid_transaction)
        assert resp.status_code == 201, f"Expected 201 Created but got {resp.status_code}"
        created_record = resp.json()
        # The response is usually a list with inserted record(s)
        assert isinstance(created_record, list) and len(created_record) == 1
        record = created_record[0]
        assert "id" in record
        record_id = record["id"]
        assert record["type"] == valid_transaction["type"]
        assert abs(float(record["amount"]) - valid_transaction["amount"]) < 0.001
        # date could be returned as string in ISO format, validate it starts correctly
        assert record["date"].startswith(valid_transaction["date"])

        # ---------------------------------------------------------------------
        # Step 2: Try to create invalid records and check for validation errors
        # Case 1: Missing amount
        invalid_data_1 = valid_transaction.copy()
        invalid_data_1.pop("amount")
        resp_invalid1 = create_financial_transaction(invalid_data_1)
        assert resp_invalid1.status_code == 400, "Expected 400 Bad Request for missing amount"

        # Case 2: Invalid type
        invalid_data_2 = valid_transaction.copy()
        invalid_data_2["type"] = "invalid_type"
        resp_invalid2 = create_financial_transaction(invalid_data_2)
        assert resp_invalid2.status_code == 400, "Expected 400 Bad Request for invalid type"

        # ---------------------------------------------------------------------
        # Step 3: Authorization enforcement tests
        # a) Attempt to create without auth token
        url = f"{BASE_URL}/rest/v1/public.lancamentos_financeiros"
        resp_no_auth = requests.post(url, json=valid_transaction, headers=headers_no_auth, timeout=TIMEOUT)
        assert resp_no_auth.status_code in (401, 403), "Expected 401/403 Unauthorized without token"

        # b) Attempt to DELETE the created record without auth token
        url = f"{BASE_URL}/rest/v1/public.lancamentos_financeiros?id=eq.{record_id}"
        resp_del_no_auth = requests.delete(url, headers=headers_no_auth, timeout=TIMEOUT)
        assert resp_del_no_auth.status_code in (401, 403), "Expected 401/403 Unauthorized on DELETE without token"

        # c) Attempt to UPDATE the record with invalid token
        invalid_headers = {"Authorization": "Bearer invalidtoken", "Content-Type": "application/json"}
        url_update = f"{BASE_URL}/rest/v1/public.lancamentos_financeiros?id=eq.{record_id}"
        update_payload = {"description": "Updated description"}
        resp_invalid_token_update = requests.patch(url_update, json=update_payload, headers=invalid_headers, timeout=TIMEOUT)
        assert resp_invalid_token_update.status_code in (401, 403), "Expected 401/403 Unauthorized on UPDATE with invalid token"

        # ---------------------------------------------------------------------
        # Step 4: Valid UPDATE with correct token
        update_payload = {"description": "Updated description"}
        url_update = f"{BASE_URL}/rest/v1/public.lancamentos_financeiros?id=eq.{record_id}"
        resp_update = requests.patch(url_update, json=update_payload, headers=headers_auth, timeout=TIMEOUT)
        assert resp_update.status_code == 204 or resp_update.status_code == 200, f"Expected 200 or 204 on update but got {resp_update.status_code}"

        # Confirm update
        resp_get = requests.get(url_update, headers=headers_auth, timeout=TIMEOUT)
        resp_get.raise_for_status()
        records = resp_get.json()
        assert len(records) == 1
        assert records[0]["description"] == update_payload["description"]

        # ---------------------------------------------------------------------
        # Step 5: Valid DELETE with auth token
        resp_delete = delete_financial_transaction(record_id)
        assert resp_delete.status_code == 204 or resp_delete.status_code == 200, f"Expected 204 or 200 on delete but got {resp_delete.status_code}"

        # Verify deletion
        resp_get_after_delete = requests.get(url_update, headers=headers_auth, timeout=TIMEOUT)
        assert resp_get_after_delete.status_code == 200
        data_after_delete = resp_get_after_delete.json()
        assert data_after_delete == [], "Record should be deleted but still present."

    finally:
        # Clean up if record still exists
        if record_id is not None:
            try:
                delete_financial_transaction(record_id)
            except Exception:
                pass

test_tc006_manage_financial_transactions_with_lancamentosfinanceiros()
