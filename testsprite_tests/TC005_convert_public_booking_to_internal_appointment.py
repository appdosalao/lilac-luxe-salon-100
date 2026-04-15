import requests
import uuid
from urllib.parse import quote

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

# Assumed admin authentication token for RPC calls requiring authorization
ADMIN_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin_token_example"

def rpc_call(function_name, payload=None, token=None):
    encoded_function_name = quote(function_name, safe='')
    url = f"{BASE_URL}/rpc/{encoded_function_name}"
    headers = {
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = token
    response = requests.post(url, json=payload or {}, headers=headers, timeout=TIMEOUT)
    return response

def create_public_booking():
    # Step 1: Call public.buscar_horarios_com_multiplos_intervalos to get available slots
    service_id = 1
    from datetime import date
    today_str = date.today().isoformat()
    payload_slots = {"service_id": service_id, "date": today_str}

    resp_slots = rpc_call("public.buscar_horarios_com_multiplos_intervalos", payload_slots)
    resp_slots.raise_for_status()
    slots = resp_slots.json()
    assert isinstance(slots, list), "Slots response should be a list"
    assert len(slots) > 0, "Slots should be available for booking"

    chosen_slot = slots[0]

    # Step 2: Create public booking with chosen slot and customer data (anonymous)
    booking_payload = {
        "cliente_nome": f"Test Customer {str(uuid.uuid4())[:8]}",
        "cliente_email": f"test_{str(uuid.uuid4())[:8]}@example.com",
        "data_hora_inicio": chosen_slot.get("start") or chosen_slot.get("data_hora_inicio") or chosen_slot.get("hora_inicio"),
        "servico_id": service_id,
        "telefone": "999999999",
    }
    resp_booking = requests.post(f"{BASE_URL}/rest/v1/public.agendamentos_online", json=booking_payload,
                                 headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
    if resp_booking.status_code != 201:
        raise AssertionError(f"Public booking creation failed with status {resp_booking.status_code}: {resp_booking.text}")
    booking_created = resp_booking.json()
    booking_id = booking_created.get("id")
    assert booking_id is not None, "Booking ID must be present in booking creation response"
    return booking_id

def delete_public_booking(booking_id):
    headers = {
        "Authorization": ADMIN_TOKEN,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    resp_del = requests.delete(f"{BASE_URL}/rest/v1/public.agendamentos_online?id=eq.{booking_id}", headers=headers, timeout=TIMEOUT)
    if resp_del.status_code not in (200, 204):
        raise AssertionError(f"Failed to delete booking {booking_id}, status: {resp_del.status_code}, response: {resp_del.text}")

def test_tc005_convert_public_booking_to_internal_appointment():
    booking_id = None
    try:
        booking_id = create_public_booking()

        payload = {"booking_id": booking_id}
        resp_convert = rpc_call("public.converter_agendamento_online", payload, token=ADMIN_TOKEN)
        assert resp_convert.status_code == 200, f"Expected 200 OK for authorized conversion, got {resp_convert.status_code}"
        result = resp_convert.json()
        assert isinstance(result, dict), "Response JSON should be a dict"
        assert "appointment_id" in result or "id" in result, "Response should contain appointment ID"

        resp_unauth = rpc_call("public.converter_agendamento_online", payload)
        assert resp_unauth.status_code in (401, 403), f"Expected 401/403 Unauthorized without token, got {resp_unauth.status_code}"

    finally:
        if booking_id:
            try:
                delete_public_booking(booking_id)
            except Exception:
                pass

test_tc005_convert_public_booking_to_internal_appointment()
