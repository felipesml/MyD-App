"""P2 backend tests: profile endpoints (GET/PUT /api/auth/me).

Covers:
- GET /api/auth/me returns agent info including profile_photo (nullable)
- PUT /api/auth/me updates name / phone
- PUT /api/auth/me persists a small base64 profile_photo and is returned by GET
- PUT /api/auth/me password change: succeeds with correct current_password,
  returns 400 with wrong current_password. Password is always restored to
  the original (password123) so subsequent tests/logins keep working.
"""

import os
import pytest
import requests

BASE_URL = os.environ.get(
    'EXPO_PUBLIC_BACKEND_URL',
    'https://prospect-tracker-64.preview.emergentagent.com'
).rstrip('/')

ORIGINAL_PASSWORD = "password123"
TEST_EMAIL = "agente@crm.com"

# 1x1 transparent PNG data URI (base64)
SMALL_BASE64_IMG = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


# ---------- GET /api/auth/me ----------
class TestAuthMe:
    def test_get_me_returns_profile_fields(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200, r.text
        data = r.json()
        # Required fields
        for key in ("id", "name", "email", "phone", "created_at"):
            assert key in data, f"missing field {key} in /auth/me response"
        # profile_photo is Optional but should exist as key (nullable)
        assert "profile_photo" in data
        assert data["email"] == TEST_EMAIL


# ---------- PUT /api/auth/me (name/phone update) ----------
class TestAuthMeUpdateProfile:
    original_name = None
    original_phone = None

    def test_capture_original(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        me = r.json()
        TestAuthMeUpdateProfile.original_name = me["name"]
        TestAuthMeUpdateProfile.original_phone = me["phone"]

    def test_update_name_and_phone(self, api_client):
        new_name = "TEST_UpdatedName"
        new_phone = "+56 9 9999 0000"
        r = api_client.put(f"{BASE_URL}/api/auth/me", json={
            "name": new_name,
            "phone": new_phone
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == new_name
        assert data["phone"] == new_phone

        # Verify via GET
        g = api_client.get(f"{BASE_URL}/api/auth/me")
        assert g.status_code == 200
        assert g.json()["name"] == new_name
        assert g.json()["phone"] == new_phone

    def test_restore_original_name_phone(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/auth/me", json={
            "name": TestAuthMeUpdateProfile.original_name,
            "phone": TestAuthMeUpdateProfile.original_phone
        })
        assert r.status_code == 200


# ---------- PUT /api/auth/me (profile_photo persistence) ----------
class TestAuthMeProfilePhoto:
    def test_update_profile_photo_persists(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/auth/me", json={
            "profile_photo": SMALL_BASE64_IMG
        })
        assert r.status_code == 200, r.text
        assert r.json()["profile_photo"] == SMALL_BASE64_IMG

        # Verify via GET
        g = api_client.get(f"{BASE_URL}/api/auth/me")
        assert g.status_code == 200
        assert g.json()["profile_photo"] == SMALL_BASE64_IMG


# ---------- PUT /api/auth/me (password change) ----------
class TestAuthMePassword:
    """Password change tests. Always restores to ORIGINAL_PASSWORD at the end."""

    NEW_PASSWORD = "TEMP_pw_p2_test_98765"

    def test_password_change_wrong_current_returns_400(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/auth/me", json={
            "current_password": "definitely-wrong-password",
            "new_password": self.NEW_PASSWORD
        })
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text}"

    def test_password_change_success_then_restore(self, api_client):
        # Change to NEW_PASSWORD
        r = api_client.put(f"{BASE_URL}/api/auth/me", json={
            "current_password": ORIGINAL_PASSWORD,
            "new_password": self.NEW_PASSWORD
        })
        assert r.status_code == 200, r.text

        # Verify by logging in with new password (fresh session, no token)
        login_new = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": self.NEW_PASSWORD
        }, timeout=15)
        assert login_new.status_code == 200, login_new.text

        # Old password should now fail
        login_old = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": ORIGINAL_PASSWORD
        }, timeout=15)
        assert login_old.status_code == 401

        # Restore original password using new token
        new_token = login_new.json()["access_token"]
        restore = requests.put(
            f"{BASE_URL}/api/auth/me",
            headers={
                "Authorization": f"Bearer {new_token}",
                "Content-Type": "application/json"
            },
            json={
                "current_password": self.NEW_PASSWORD,
                "new_password": ORIGINAL_PASSWORD
            },
            timeout=15
        )
        assert restore.status_code == 200, restore.text

        # Final verification: original password works again
        final = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": ORIGINAL_PASSWORD
        }, timeout=15)
        assert final.status_code == 200, final.text
