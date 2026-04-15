import requests

BASE_URL = "http://localhost:8084/http://localhost:8080"
TIMEOUT = 30

# Replace these with valid tenant admin credentials for authentication
TEST_USER_EMAIL = "tenantadmin@example.com"
TEST_USER_PASSWORD = "StrongPassword123!"

def test_retrieve_financial_summary_with_resumofinanceiro_view():
    # Helper to sign in and get access token via RPC auth.users sign-in
    def sign_in(email, password):
        url = f"{BASE_URL}/rest/v1/rpc/auth.users"
        payload = {"email": email, "password": password}
        headers = {
            "Content-Type": "application/json",
            "Prefer": "params=single-object"
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["session_token"]

    # Try to get financial summary without authentication header (expect 401/403)
    url_summary = f"{BASE_URL}/rest/v1/public.resumo_financeiro"
    # The resumo_financeiro is a view, accessed via GET on public.resumo_financeiro with auth

    # Test unauthorized access
    resp_unauth = requests.get(url_summary, timeout=TIMEOUT)
    assert resp_unauth.status_code in (401, 403), f"Expected 401 or 403 for unauthorized access, got {resp_unauth.status_code}"

    # Sign in admin user to get token
    token = sign_in(TEST_USER_EMAIL, TEST_USER_PASSWORD)

    headers_auth = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Test authorized access, should get tenant-scoped financial summary
    resp_auth = requests.get(url_summary, headers=headers_auth, timeout=TIMEOUT)
    assert resp_auth.status_code == 200, f"Expected 200 OK for authorized access, got {resp_auth.status_code}"

    data = resp_auth.json()
    assert isinstance(data, list), "Expected a list as response"
    # If the summary is empty list or has tenant financial data
    # Validate keys typical for financial summary (e.g. income, expenses)
    if data:
        sample = data[0]
        assert isinstance(sample, dict), "Expected financial summary items to be dict"
        # Sample keys from typical financial summary view, adjust if needed
        expected_keys = {"tenant_id", "total_income", "total_expenses", "net_balance"}
        assert expected_keys.intersection(sample.keys()), f"Expected at least one key from {expected_keys} in financial summary"

test_retrieve_financial_summary_with_resumofinanceiro_view()