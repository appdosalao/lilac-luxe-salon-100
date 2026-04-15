import requests

BASE_URL = "http://localhost:8080/"
RPC_ENDPOINT = BASE_URL + "rest/v1/rpc/buscar_horarios_com_multiplos_intervalos"

HEADERS_RPC = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def test_fetch_available_time_slots_for_service_and_date():
    timeout = 30

    # Valid input test: Typical valid service_id and date
    valid_payload = {
        "service_id": 1,  # assuming 1 is a valid service_id existing in DB
        "date": "2026-05-01"
    }

    response_valid = requests.post(RPC_ENDPOINT, json=valid_payload, headers=HEADERS_RPC, timeout=timeout)
    assert response_valid.status_code == 200, f"Expected 200 OK but got {response_valid.status_code}"
    slots = response_valid.json()
    assert isinstance(slots, list), "Response should be a list of available time slots"
    # Each slot should have time or interval info (depending on schema, loosely checking keys existence)
    if slots:
        slot = slots[0]
        assert isinstance(slot, dict), "Each slot should be a dict"
        assert any(k in slot for k in ("start_time", "end_time", "interval")), "Slot should contain time info"

    # Invalid input test 1: invalid date format
    invalid_payload_date = {
        "service_id": 1,
        "date": "01-05-2026"  # invalid date format, expecting yyyy-mm-dd
    }

    response_invalid_date = requests.post(RPC_ENDPOINT, json=invalid_payload_date, headers=HEADERS_RPC, timeout=timeout)
    assert response_invalid_date.status_code in (400, 422), f"Expected 400 or 422 Validation Error but got {response_invalid_date.status_code}"
    error_body = response_invalid_date.json()
    assert isinstance(error_body, dict), "Error response should be a dict"
    assert "error" in error_body or "message" in error_body, "Error response should contain error or message field"

    # Invalid input test 2: missing service_id
    invalid_payload_missing_service = {
        "date": "2026-05-01"
    }
    response_missing_service = requests.post(RPC_ENDPOINT, json=invalid_payload_missing_service, headers=HEADERS_RPC, timeout=timeout)
    assert response_missing_service.status_code in (400, 422), f"Expected 400 or 422 Validation Error but got {response_missing_service.status_code}"
    error_body2 = response_missing_service.json()
    assert isinstance(error_body2, dict), "Error response should be a dict"
    assert "error" in error_body2 or "message" in error_body2, "Error response should contain error or message field"

    # Invalid input test 3: non-existent service_id
    invalid_payload_nonexistent_service = {
        "service_id": 9999999,  # assumed non-existent service_id
        "date": "2026-05-01"
    }
    response_nonexistent_service = requests.post(
        RPC_ENDPOINT, json=invalid_payload_nonexistent_service, headers=HEADERS_RPC, timeout=timeout
    )
    # Expect 200 with empty list or validation error depending on backend design
    if response_nonexistent_service.status_code == 200:
        slots_resp = response_nonexistent_service.json()
        assert isinstance(slots_resp, list), "Response should be a list"
        assert len(slots_resp) == 0, "Non-existent service should return empty slots list"
    else:
        assert response_nonexistent_service.status_code in (400, 422), "Expected 400/422 or 200 with empty list for bad service_id"
        error_body3 = response_nonexistent_service.json()
        assert "error" in error_body3 or "message" in error_body3

    # Test isolation: multi-tenant data isolation checks are implicit because endpoint is anonymous,
    # so no token means data should be appropriately isolated - could add more complex tenant token based tests elsewhere.

test_fetch_available_time_slots_for_service_and_date()
