import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

def test_profile_management_public_usuarios():
    # Helper function to call Supabase RPC auth.users for signup or signin
    def rpc_auth_users(payload):
        url = f"{BASE_URL}/rpc/auth.users"
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        return response

    # Signup new user
    signup_payload = {
        "email": "testuser_tc002@example.com",
        "password": "SecurePass123!",
        "action": "signup"
    }
    signup_resp = rpc_auth_users(signup_payload)
    assert signup_resp.status_code == 201, f"Signup failed: {signup_resp.text}"
    signup_data = signup_resp.json()
    user_id = signup_data.get("user_id")
    session_token = signup_data.get("session_token")
    assert user_id and session_token, "Signup response missing user_id or session_token"

    headers_auth = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {session_token}"
    }

    try:
        # GET public.usuarios profile - authenticated
        url_get_profile = f"{BASE_URL}/public/usuarios"
        get_resp = requests.get(url_get_profile, headers=headers_auth, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Authenticated GET profile failed: {get_resp.text}"
        profile = get_resp.json()
        # Profile can be empty/default, but should be an object
        assert isinstance(profile, dict), "Profile GET response is not a dict"

        # UPDATE public.usuarios profile - authenticated
        update_payload = {
            "full_name": "Test User TC002",
            "phone": "+5511999999999"
        }
        update_resp = requests.put(url_get_profile, json=update_payload, headers=headers_auth, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Authenticated UPDATE profile failed: {update_resp.text}"
        updated_profile = update_resp.json()
        # Verify updated fields are present in response
        assert updated_profile.get("full_name") == update_payload["full_name"], "Profile full_name not updated"
        assert updated_profile.get("phone") == update_payload["phone"], "Profile phone not updated"

        # Attempt GET public.usuarios without token (unauthorized)
        get_no_auth = requests.get(url_get_profile, timeout=TIMEOUT)
        assert get_no_auth.status_code in (401, 403), "GET profile without token did not deny access"

        # Attempt UPDATE public.usuarios without token (unauthorized)
        update_no_auth = requests.put(url_get_profile, json=update_payload, timeout=TIMEOUT)
        assert update_no_auth.status_code in (401, 403), "UPDATE profile without token did not deny access"

    finally:
        # Cleanup: If API supports user deletion, delete user here.
        # Since no deletion endpoint is specified, this is omitted.
        pass

test_profile_management_public_usuarios()
