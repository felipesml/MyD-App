"""Backend tests for appointment auto-status + edit/delete lock rules.

Rules under test:
- upcoming_appointments in dashboard/stats counts appointments with status 'programada'
  (today and future). Creating a today/future appointment increases it by 1.
- Past 'programada' appointments (date_time strictly before today's midnight UTC) are
  auto-flipped to 'no_informado' when GET /appointments, GET /appointments/{id} or
  GET /dashboard/stats is called.
- PUT /appointments/{id} on a past appointment returns 403.
- DELETE /appointments/{id} on a past appointment returns 403.
- PUT /appointments/{id}/status?new_status=no_informado is accepted.
- PUT and DELETE on a TODAY/FUTURE appointment still return 200.
"""

import os
import pytest
import requests
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://prospect-tracker-64.preview.emergentagent.com').rstrip('/')
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


# --- helpers for direct DB manipulation (needed to create a genuinely past appointment) ---
def _sync_db():
    c = MongoClient(MONGO_URL)
    return c[DB_NAME]


class TestAppointmentAutoStatus:
    """Auto-flip past 'programada' -> 'no_informado' on any read."""

    past_appt_id = None
    agent_id = None

    def test_seed_past_appointment_direct_db(self, api_client):
        # Get agent id via /auth/me
        me = api_client.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200, me.text
        TestAppointmentAutoStatus.agent_id = me.json()["id"]

        # Create a future appointment via API first (POST validates future date)
        future = (datetime.utcnow() + timedelta(days=5)).isoformat()
        r = api_client.post(f"{BASE_URL}/api/appointments", json={
            "title": "TEST_PastAppt_AutoStatus",
            "appointment_type": "visita",
            "date_time": future,
            "duration_minutes": 30
        })
        assert r.status_code == 200, r.text
        appt_id = r.json()["id"]
        TestAppointmentAutoStatus.past_appt_id = appt_id

        # Now backdate it 3 days ago directly in DB and force status=programada
        db = _sync_db()
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        res = db.appointments.update_one(
            {"_id": ObjectId(appt_id)},
            {"$set": {"date_time": three_days_ago, "status": "programada"}}
        )
        assert res.modified_count == 1

    def test_get_appointment_auto_flips_status(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/appointments/{TestAppointmentAutoStatus.past_appt_id}")
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "no_informado", r.json()

    def test_dashboard_stats_also_triggers_flip(self, api_client):
        # Reset to programada then hit /dashboard/stats
        db = _sync_db()
        db.appointments.update_one(
            {"_id": ObjectId(TestAppointmentAutoStatus.past_appt_id)},
            {"$set": {"status": "programada"}}
        )
        r = api_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 200, r.text
        # After the endpoint runs, the row should be no_informado
        row = db.appointments.find_one({"_id": ObjectId(TestAppointmentAutoStatus.past_appt_id)})
        assert row["status"] == "no_informado"

    def test_list_appointments_also_flips(self, api_client):
        db = _sync_db()
        db.appointments.update_one(
            {"_id": ObjectId(TestAppointmentAutoStatus.past_appt_id)},
            {"$set": {"status": "programada"}}
        )
        r = api_client.get(f"{BASE_URL}/api/appointments")
        assert r.status_code == 200
        row = db.appointments.find_one({"_id": ObjectId(TestAppointmentAutoStatus.past_appt_id)})
        assert row["status"] == "no_informado"

    def test_put_past_appointment_returns_403(self, api_client):
        future = (datetime.utcnow() + timedelta(days=1)).isoformat()
        r = api_client.put(
            f"{BASE_URL}/api/appointments/{TestAppointmentAutoStatus.past_appt_id}",
            json={
                "title": "SHOULD_NOT_UPDATE",
                "appointment_type": "visita",
                "date_time": future,
                "duration_minutes": 30
            }
        )
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"

    def test_delete_past_appointment_returns_403(self, api_client):
        r = api_client.delete(f"{BASE_URL}/api/appointments/{TestAppointmentAutoStatus.past_appt_id}")
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"

    def test_status_update_no_informado_accepted(self, api_client):
        # Set to programada in DB, then status endpoint should accept no_informado
        db = _sync_db()
        db.appointments.update_one(
            {"_id": ObjectId(TestAppointmentAutoStatus.past_appt_id)},
            {"$set": {"status": "programada"}}
        )
        r = api_client.put(
            f"{BASE_URL}/api/appointments/{TestAppointmentAutoStatus.past_appt_id}/status",
            params={"new_status": "no_informado"}
        )
        assert r.status_code == 200, r.text
        row = db.appointments.find_one({"_id": ObjectId(TestAppointmentAutoStatus.past_appt_id)})
        assert row["status"] == "no_informado"

    def test_status_update_completada_and_cancelada(self, api_client):
        r1 = api_client.put(
            f"{BASE_URL}/api/appointments/{TestAppointmentAutoStatus.past_appt_id}/status",
            params={"new_status": "completada"}
        )
        assert r1.status_code == 200, r1.text
        r2 = api_client.put(
            f"{BASE_URL}/api/appointments/{TestAppointmentAutoStatus.past_appt_id}/status",
            params={"new_status": "cancelada"}
        )
        assert r2.status_code == 200, r2.text

    def test_cleanup_past(self, api_client):
        # remove directly from DB (DELETE would be blocked)
        db = _sync_db()
        db.appointments.delete_one({"_id": ObjectId(TestAppointmentAutoStatus.past_appt_id)})


class TestUpcomingAppointmentsCounter:
    """Creating a today/future appointment increases dashboard.upcoming_appointments by 1."""

    created_id = None

    def test_counter_increments_on_create(self, api_client):
        # Read initial stats
        s0 = api_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert s0.status_code == 200
        initial = s0.json()["upcoming_appointments"]

        # Create future appointment
        future = (datetime.utcnow() + timedelta(hours=6)).isoformat()
        c = api_client.post(f"{BASE_URL}/api/appointments", json={
            "title": "TEST_UpcomingCounter",
            "appointment_type": "reunion",
            "date_time": future,
            "duration_minutes": 45
        })
        assert c.status_code == 200, c.text
        TestUpcomingAppointmentsCounter.created_id = c.json()["id"]

        # Read stats again
        s1 = api_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert s1.status_code == 200
        after = s1.json()["upcoming_appointments"]
        assert after == initial + 1, f"expected {initial + 1}, got {after}"

    def test_today_appointment_edit_and_delete_still_work(self, api_client):
        # Edit works
        new_future = (datetime.utcnow() + timedelta(hours=8)).isoformat()
        r = api_client.put(
            f"{BASE_URL}/api/appointments/{TestUpcomingAppointmentsCounter.created_id}",
            json={
                "title": "TEST_UpcomingCounter_Edited",
                "appointment_type": "reunion",
                "date_time": new_future,
                "duration_minutes": 60
            }
        )
        assert r.status_code == 200, r.text
        g = api_client.get(f"{BASE_URL}/api/appointments/{TestUpcomingAppointmentsCounter.created_id}")
        assert g.json()["title"] == "TEST_UpcomingCounter_Edited"

        # Delete works
        d = api_client.delete(f"{BASE_URL}/api/appointments/{TestUpcomingAppointmentsCounter.created_id}")
        assert d.status_code == 200, d.text
        g2 = api_client.get(f"{BASE_URL}/api/appointments/{TestUpcomingAppointmentsCounter.created_id}")
        assert g2.status_code == 404


class TestProfilePhotoRoundtrip:
    """PUT /auth/me with a base64 profile_photo persists and returns it (fixes for settings crash)."""

    def test_set_and_clear_profile_photo(self, api_client):
        tiny_b64 = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")
        r = api_client.put(f"{BASE_URL}/api/auth/me", json={"profile_photo": tiny_b64})
        assert r.status_code == 200, r.text
        assert r.json().get("profile_photo") == tiny_b64

        me = api_client.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        assert me.json().get("profile_photo") == tiny_b64

        # cleanup: clear the photo (empty string -> falsy in RN so Ionicons renders)
        api_client.put(f"{BASE_URL}/api/auth/me", json={"profile_photo": ""})
