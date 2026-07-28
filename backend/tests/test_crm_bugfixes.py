"""Backend tests covering the P0 bug fixes for CRM Inmobiliario.

Covers:
- Auth login
- Client CRUD + delete conflict (409) & cascade delete
- Lead GET by id
- Property GET by id
- Appointment GET by id
- Buyer reserve basic list
"""

import os
import pytest
import requests
from datetime import datetime, timedelta

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://prospect-tracker-64.preview.emergentagent.com').rstrip('/')


# ---------- Auth ----------
class TestAuth:
    def test_login(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["email"] == "agente@crm.com"


# ---------- Client CRUD + delete conflict ----------
class TestClientDeleteConflict:
    """Verifies that deleting a client with properties returns 409,
    and that cascade=true removes both client and its properties."""

    created_client_id = None
    created_property_id = None

    def test_create_client_and_property(self, api_client):
        c_resp = api_client.post(f"{BASE_URL}/api/clients", json={
            "name": "TEST_ClientDeleteConflict",
            "phone": "+56911111111",
            "email": "test_delete@example.com"
        })
        assert c_resp.status_code == 200, c_resp.text
        client = c_resp.json()
        assert client["name"] == "TEST_ClientDeleteConflict"
        TestClientDeleteConflict.created_client_id = client["id"]

        p_resp = api_client.post(f"{BASE_URL}/api/properties", json={
            "client_id": client["id"],
            "title": "TEST_PropertyForDelete",
            "address": "Av. Siempre Viva 742",
            "city": "Santiago",
            "region": "RM",
            "price": 1000000,
            "property_type": "casa",
            "transaction_type": "venta"
        })
        assert p_resp.status_code == 200, p_resp.text
        prop = p_resp.json()
        assert prop["client_id"] == client["id"]
        TestClientDeleteConflict.created_property_id = prop["id"]

    def test_delete_client_with_properties_returns_409(self, api_client):
        assert TestClientDeleteConflict.created_client_id is not None
        resp = api_client.delete(f"{BASE_URL}/api/clients/{TestClientDeleteConflict.created_client_id}")
        assert resp.status_code == 409, f"expected 409, got {resp.status_code}: {resp.text}"
        detail = resp.json().get("detail", "")
        assert "propiedad" in detail.lower() or "1" in detail

    def test_delete_client_cascade_true(self, api_client):
        assert TestClientDeleteConflict.created_client_id is not None
        resp = api_client.delete(
            f"{BASE_URL}/api/clients/{TestClientDeleteConflict.created_client_id}?cascade=true"
        )
        assert resp.status_code == 200, resp.text

        # verify client deleted
        get_c = api_client.get(f"{BASE_URL}/api/clients/{TestClientDeleteConflict.created_client_id}")
        assert get_c.status_code == 404

        # verify property deleted
        get_p = api_client.get(f"{BASE_URL}/api/properties/{TestClientDeleteConflict.created_property_id}")
        assert get_p.status_code == 404


# ---------- Detail endpoints (GET by id) ----------
class TestDetailEndpoints:
    client_id = None
    lead_id = None
    property_id = None
    appointment_id = None

    def test_seed_entities(self, api_client):
        # Create client
        c = api_client.post(f"{BASE_URL}/api/clients", json={
            "name": "TEST_DetailClient",
            "phone": "+56922222222"
        })
        assert c.status_code == 200, c.text
        TestDetailEndpoints.client_id = c.json()["id"]

        # Create lead
        l = api_client.post(f"{BASE_URL}/api/leads", json={
            "name": "TEST_DetailLead",
            "phone": "+56933333333",
            "interest_type": "compra",
            "budget": 5000000,
            "status": "nuevo",
            "source": "web"
        })
        assert l.status_code == 200, l.text
        TestDetailEndpoints.lead_id = l.json()["id"]

        # Create property
        p = api_client.post(f"{BASE_URL}/api/properties", json={
            "client_id": TestDetailEndpoints.client_id,
            "title": "TEST_DetailProperty",
            "address": "Calle Falsa 123",
            "city": "Santiago",
            "region": "RM",
            "price": 200000,
            "property_type": "apartamento",
            "transaction_type": "arriendo"
        })
        assert p.status_code == 200, p.text
        TestDetailEndpoints.property_id = p.json()["id"]

        # Create appointment
        future = (datetime.utcnow() + timedelta(days=2)).isoformat()
        a = api_client.post(f"{BASE_URL}/api/appointments", json={
            "title": "TEST_DetailAppointment",
            "appointment_type": "visita",
            "date_time": future,
            "duration_minutes": 45,
            "related_entity": "client",
            "related_id": TestDetailEndpoints.client_id
        })
        assert a.status_code == 200, a.text
        TestDetailEndpoints.appointment_id = a.json()["id"]

    def test_get_lead_by_id(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/leads/{TestDetailEndpoints.lead_id}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == TestDetailEndpoints.lead_id
        assert data["name"] == "TEST_DetailLead"
        assert data["interest_type"] == "compra"

    def test_get_property_by_id(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/properties/{TestDetailEndpoints.property_id}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == TestDetailEndpoints.property_id
        assert data["title"] == "TEST_DetailProperty"
        assert data["client_id"] == TestDetailEndpoints.client_id
        assert data["client_name"] == "TEST_DetailClient"

    def test_get_appointment_by_id(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/appointments/{TestDetailEndpoints.appointment_id}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == TestDetailEndpoints.appointment_id
        assert data["title"] == "TEST_DetailAppointment"
        assert data["related_entity"] == "client"
        assert data["related_name"] == "TEST_DetailClient"

    def test_edit_lead(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/leads/{TestDetailEndpoints.lead_id}", json={
            "name": "TEST_DetailLead_Edited",
            "phone": "+56933333333",
            "interest_type": "compra",
            "budget": 5500000,
            "status": "contactado",
            "source": "web"
        })
        assert r.status_code == 200, r.text
        # verify persisted
        g = api_client.get(f"{BASE_URL}/api/leads/{TestDetailEndpoints.lead_id}")
        assert g.json()["status"] == "contactado"
        assert g.json()["name"] == "TEST_DetailLead_Edited"

    def test_edit_appointment(self, api_client):
        future = (datetime.utcnow() + timedelta(days=3)).isoformat()
        r = api_client.put(f"{BASE_URL}/api/appointments/{TestDetailEndpoints.appointment_id}", json={
            "title": "TEST_DetailAppointment_Edited",
            "appointment_type": "reunion",
            "date_time": future,
            "duration_minutes": 60
        })
        assert r.status_code == 200, r.text
        g = api_client.get(f"{BASE_URL}/api/appointments/{TestDetailEndpoints.appointment_id}")
        assert g.json()["title"] == "TEST_DetailAppointment_Edited"
        assert g.json()["appointment_type"] == "reunion"

    def test_cleanup(self, api_client):
        # delete appointment
        api_client.delete(f"{BASE_URL}/api/appointments/{TestDetailEndpoints.appointment_id}")
        # delete lead
        api_client.delete(f"{BASE_URL}/api/leads/{TestDetailEndpoints.lead_id}")
        # delete property first, then client
        api_client.delete(f"{BASE_URL}/api/properties/{TestDetailEndpoints.property_id}")
        api_client.delete(f"{BASE_URL}/api/clients/{TestDetailEndpoints.client_id}")


# ---------- Buyer reserve ----------
class TestBuyerReserve:
    def test_list_buyer_reserves(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/buyer-reserves")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_and_list_buyer_reserve(self, api_client):
        c = api_client.post(f"{BASE_URL}/api/buyer-reserves", json={
            "first_name": "TEST_BR",
            "last_name": "Buyer",
            "phone": "+56944444444",
            "budget": 8000000,
            "payment_method": "contado"
        })
        assert c.status_code == 200, c.text
        br_id = c.json()["id"]
        # list contains it
        lst = api_client.get(f"{BASE_URL}/api/buyer-reserves")
        assert any(item["id"] == br_id for item in lst.json())
        # cleanup
        api_client.delete(f"{BASE_URL}/api/buyer-reserves/{br_id}")


# ---------- Error handling ----------
class TestErrors:
    def test_get_lead_invalid_id(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/leads/not-an-objectid")
        assert r.status_code == 400

    def test_get_property_not_found(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/properties/507f1f77bcf86cd799439011")
        assert r.status_code == 404

    def test_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/clients", timeout=15)
        assert r.status_code in (401, 403)
