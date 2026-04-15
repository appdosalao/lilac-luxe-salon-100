import requests
import uuid

BASE_URL = "http://localhost:8084/"
RPC_AUTH_USERS = "auth.users"
TIMEOUT = 30
HEADERS_JSON = {"Content-Type": "application/json"}

def test_rpc_authusers_signup_signin_flow():
    # Generate unique email to avoid conflicts
    unique_email = f"test.user.{uuid.uuid4()}@example.com"
    password = "TestPass!1234"

    signup_payload = {
        "email": unique_email,
        "password": password
    }

    # 1. Sign up with valid credentials via RPC auth.users
    signup_response = requests.post(
        f"{BASE_URL}rpc/{RPC_AUTH_USERS}",
        json={"action": "signup", **signup_payload},
        headers=HEADERS_JSON,
        timeout=TIMEOUT
    )
    try:
        assert signup_response.status_code == 201, f"Expected 201 on signup, got {signup_response.status_code}"
        signup_data = signup_response.json()
        assert "user" in signup_data and "id" in signup_data["user"], "Signup response missing user id"
        assert "access_token" in signup_data, "Signup response missing access_token"
        user_id = signup_data["user"]["id"]
        access_token = signup_data["access_token"]
        bearer_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # 2. Sign in with same valid credentials via RPC auth.users
        signin_response = requests.post(
            f"{BASE_URL}rpc/{RPC_AUTH_USERS}",
            json={"action": "signin", **signup_payload},
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert signin_response.status_code == 200, f"Expected 200 on signin, got {signin_response.status_code}"
        signin_data = signin_response.json()
        assert "user" in signin_data and signin_data["user"]["id"] == user_id, "Signin user id mismatch"
        assert "access_token" in signin_data and signin_data["access_token"], "Signin missing access_token"

        # 3. Sign in with invalid credentials (wrong password)
        invalid_signin_payload = {
            "email": unique_email,
            "password": "WrongPassword!123"
        }
        invalid_signin_response = requests.post(
            f"{BASE_URL}rpc/{RPC_AUTH_USERS}",
            json={"action": "signin", **invalid_signin_payload},
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert invalid_signin_response.status_code == 401 or invalid_signin_response.status_code == 403, (
            f"Expected 401 or 403 on invalid signin, got {invalid_signin_response.status_code}"
        )

        # 4. GET public.usuarios with valid token to verify profile (should be empty/default)
        profile_response = requests.get(
            f"{BASE_URL}rest/v1/public.usuarios",
            headers=bearer_headers,
            timeout=TIMEOUT
        )
        assert profile_response.status_code == 200, f"Expected 200 fetching profile with token, got {profile_response.status_code}"
        users = profile_response.json()
        assert isinstance(users, list), "Profile GET response not a list"
        found_user = any(u.get("id") == user_id for u in users)
        assert found_user, "User not found in public.usuarios with valid token"

        # 5. GET public.usuarios without token should fail with 401 or 403
        profile_response_no_auth = requests.get(
            f"{BASE_URL}rest/v1/public.usuarios",
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert profile_response_no_auth.status_code in (401,403), (
            f"Expected 401 or 403 fetching profile without token, got {profile_response_no_auth.status_code}"
        )

    finally:
        # Cleanup: delete the created user via RPC auth.users (if supported)
        # Since auth.users is marked RPC internal and no explicit delete endpoint is described,
        # attempt sign in and delete with token or skip cleanup if no API supports delete.
        # Here we try to revoke token or delete user if an endpoint exists.
        pass  # No delete endpoint described; skipping cleanup.

test_rpc_authusers_signup_signin_flow()
