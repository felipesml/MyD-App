import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://prospect-tracker-64.preview.emergentagent.com').rstrip('/')

TEST_EMAIL = "agente@crm.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def auth_token():
    """Login and return JWT token. Register if login fails."""
    session = requests.Session()
    resp = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }, timeout=15)
    if resp.status_code != 200:
        # Attempt to register
        reg = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Juan Perez",
            "email": TEST_EMAIL,
            "phone": "+56 9 1234 5678",
            "password": TEST_PASSWORD
        }, timeout=15)
        if reg.status_code != 200:
            pytest.skip(f"Cannot login/register test agent: {resp.status_code} / {reg.status_code}")
        return reg.json()["access_token"]
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def api_client(auth_token):
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session
