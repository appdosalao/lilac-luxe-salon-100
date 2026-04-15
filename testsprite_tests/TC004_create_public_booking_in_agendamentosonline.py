import requests
import uuid

BASE_URL = "http://localhost:8080/"
TIMEOUT = 30

def test_create_public_booking_in_agendamentosonline():
    headers = {
        "Content-Type": "application/json"
    }

    # Valid booking payload (anonymous user)
    valid_booking_payload = {
        "service_id": str(uuid.uuid4()),  # Random service_id for test, replace if needed with a known valid service_id
        "date": "2026-06-10",
        "time_slot": "10:00",
        "customer_name": "Test Customer",
        "customer_contact": "test.customer@example.com",
        "notes": "Test booking created anonymously."
    }

    # Insert a valid booking - expect 201 Created and booking confirmation with booking id
    create_booking_url = f"{BASE_URL}rest/v1/public.agendamentos_online"
    try:
        # Create booking success case
        response = requests.post(create_booking_url, json=valid_booking_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201 on booking creation, got {response.status_code}"
        booking_resp_json = response.json()
        assert isinstance(booking_resp_json, list) and len(booking_resp_json) == 1, "Response should be a list with one booking object"
        booking_id = booking_resp_json[0].get("id")
        assert booking_id is not None, "Booking confirmation missing booking id"

        # Missing required field case: remove customer_name
        invalid_payload_missing_name = valid_booking_payload.copy()
        invalid_payload_missing_name.pop("customer_name")
        response_missing_field = requests.post(create_booking_url, json=invalid_payload_missing_name, headers=headers, timeout=TIMEOUT)
        assert response_missing_field.status_code in (400, 422), f"Expected 400 or 422 for missing required field, got {response_missing_field.status_code}"

        # Missing required field case: remove service_id
        invalid_payload_missing_serviceid = valid_booking_payload.copy()
        invalid_payload_missing_serviceid.pop("service_id")
        response_missing_serviceid = requests.post(create_booking_url, json=invalid_payload_missing_serviceid, headers=headers, timeout=TIMEOUT)
        assert response_missing_serviceid.status_code in (400, 422), f"Expected 400 or 422 for missing required service_id, got {response_missing_serviceid.status_code}"

    finally:
        # Cleanup: attempt to delete the booking created (if any)
        if 'booking_id' in locals():
            delete_url = f"{BASE_URL}rest/v1/public.agendamentos_online?id=eq.{booking_id}"
            try:
                del_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                # No assert on delete; just try best effort cleanup
            except Exception:
                pass

test_create_public_booking_in_agendamentosonline()
