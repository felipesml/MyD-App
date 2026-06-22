#!/usr/bin/env python3
"""
Backend API Test Suite for Real Estate CRM
Tests all endpoints as specified in the review request
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Optional

# Base URL from frontend/.env
BASE_URL = "https://prospect-tracker-64.preview.emergentagent.com/api"

# Test credentials
TEST_AGENT = {
    "name": "Juan Pérez",
    "email": "agente@crm.com",
    "password": "password123",
    "phone": "+56 9 1234 5678"
}

# Global variables to store IDs and tokens
auth_token = None
agent_id = None
client_id = None
lead_id = None
property_id = None
appointment_id = None

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "total": 0
}

def log_test(test_name: str, passed: bool, details: str = ""):
    """Log test result"""
    test_results["total"] += 1
    if passed:
        test_results["passed"].append(test_name)
        print(f"✅ PASS: {test_name}")
        if details:
            print(f"   {details}")
    else:
        test_results["failed"].append(test_name)
        print(f"❌ FAIL: {test_name}")
        if details:
            print(f"   {details}")

def make_request(method: str, endpoint: str, data: Optional[Dict] = None, 
                 use_auth: bool = False, params: Optional[Dict] = None) -> requests.Response:
    """Make HTTP request with optional authentication"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if use_auth and auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except Exception as e:
        print(f"   Request error: {str(e)}")
        raise

# ==================== AUTHENTICATION TESTS ====================

def test_01_register_agent():
    """Test 1: POST /api/auth/register - Register new agent"""
    global auth_token, agent_id
    
    print("\n" + "="*60)
    print("AUTHENTICATION TESTS")
    print("="*60)
    
    try:
        response = make_request("POST", "/auth/register", data=TEST_AGENT)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "agent" in data:
                auth_token = data["access_token"]
                agent_id = data["agent"]["id"]
                log_test("Register Agent", True, 
                        f"Agent registered successfully. ID: {agent_id}")
            else:
                log_test("Register Agent", False, 
                        "Response missing required fields")
        elif response.status_code == 400 and "already registered" in response.text:
            # Agent already exists, try login instead
            print("   Agent already exists, will use login")
            test_02_login_agent()
        else:
            log_test("Register Agent", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Register Agent", False, f"Exception: {str(e)}")

def test_02_login_agent():
    """Test 2: POST /api/auth/login - Login agent"""
    global auth_token, agent_id
    
    try:
        login_data = {
            "email": TEST_AGENT["email"],
            "password": TEST_AGENT["password"]
        }
        response = make_request("POST", "/auth/login", data=login_data)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "agent" in data:
                auth_token = data["access_token"]
                agent_id = data["agent"]["id"]
                log_test("Login Agent", True, 
                        f"Login successful. Token received.")
            else:
                log_test("Login Agent", False, 
                        "Response missing required fields")
        else:
            log_test("Login Agent", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Login Agent", False, f"Exception: {str(e)}")

def test_03_get_current_agent():
    """Test 3: GET /api/auth/me - Get current agent info"""
    try:
        response = make_request("GET", "/auth/me", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "email" in data and data["email"] == TEST_AGENT["email"]:
                log_test("Get Current Agent", True, 
                        f"Agent info retrieved: {data['name']}")
            else:
                log_test("Get Current Agent", False, 
                        "Response data incorrect")
        else:
            log_test("Get Current Agent", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Current Agent", False, f"Exception: {str(e)}")

# ==================== CLIENTS TESTS ====================

def test_04_create_client():
    """Test 4: POST /api/clients - Create client"""
    global client_id
    
    print("\n" + "="*60)
    print("CLIENTS TESTS")
    print("="*60)
    
    try:
        client_data = {
            "name": "María González",
            "email": "maria.gonzalez@email.com",
            "phone": "+56 9 8765 4321",
            "address": "Av. Providencia 1234, Santiago",
            "notes": "Cliente interesado en propiedades en Las Condes"
        }
        response = make_request("POST", "/clients", data=client_data, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data:
                client_id = data["id"]
                log_test("Create Client", True, 
                        f"Client created successfully. ID: {client_id}")
            else:
                log_test("Create Client", False, 
                        "Response missing client ID")
        else:
            log_test("Create Client", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Client", False, f"Exception: {str(e)}")

def test_05_get_all_clients():
    """Test 5: GET /api/clients - Get all clients"""
    try:
        response = make_request("GET", "/clients", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get All Clients", True, 
                        f"Retrieved {len(data)} clients")
            else:
                log_test("Get All Clients", False, 
                        "Response is not a list")
        else:
            log_test("Get All Clients", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Clients", False, f"Exception: {str(e)}")

def test_06_get_specific_client():
    """Test 6: GET /api/clients/{id} - Get specific client"""
    if not client_id:
        log_test("Get Specific Client", False, "No client_id available")
        return
    
    try:
        response = make_request("GET", f"/clients/{client_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if data["id"] == client_id:
                log_test("Get Specific Client", True, 
                        f"Client retrieved: {data['name']}")
            else:
                log_test("Get Specific Client", False, 
                        "Client ID mismatch")
        else:
            log_test("Get Specific Client", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Specific Client", False, f"Exception: {str(e)}")

def test_07_update_client():
    """Test 7: PUT /api/clients/{id} - Update client"""
    if not client_id:
        log_test("Update Client", False, "No client_id available")
        return
    
    try:
        update_data = {
            "name": "María González Pérez",
            "email": "maria.gonzalez@email.com",
            "phone": "+56 9 8765 4321",
            "address": "Av. Providencia 1234, Oficina 501, Santiago",
            "notes": "Cliente VIP - Interesado en propiedades premium"
        }
        response = make_request("PUT", f"/clients/{client_id}", 
                              data=update_data, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if data["name"] == update_data["name"]:
                log_test("Update Client", True, 
                        "Client updated successfully")
            else:
                log_test("Update Client", False, 
                        "Update not reflected in response")
        else:
            log_test("Update Client", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Client", False, f"Exception: {str(e)}")

# ==================== LEADS TESTS ====================

def test_09_create_lead():
    """Test 9: POST /api/leads - Create lead"""
    global lead_id
    
    print("\n" + "="*60)
    print("LEADS TESTS")
    print("="*60)
    
    try:
        lead_data = {
            "name": "Carlos Rodríguez",
            "email": "carlos.rodriguez@email.com",
            "phone": "+56 9 5555 1234",
            "interest_type": "compra",
            "budget": 150000000,
            "status": "nuevo",
            "source": "web",
            "notes": "Busca departamento 2D/2B en Providencia"
        }
        response = make_request("POST", "/leads", data=lead_data, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data:
                lead_id = data["id"]
                log_test("Create Lead", True, 
                        f"Lead created successfully. ID: {lead_id}")
            else:
                log_test("Create Lead", False, 
                        "Response missing lead ID")
        else:
            log_test("Create Lead", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Lead", False, f"Exception: {str(e)}")

def test_10_get_all_leads():
    """Test 10: GET /api/leads - Get all leads"""
    try:
        response = make_request("GET", "/leads", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get All Leads", True, 
                        f"Retrieved {len(data)} leads")
            else:
                log_test("Get All Leads", False, 
                        "Response is not a list")
        else:
            log_test("Get All Leads", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Leads", False, f"Exception: {str(e)}")

def test_11_get_specific_lead():
    """Test 11: GET /api/leads/{id} - Get specific lead"""
    if not lead_id:
        log_test("Get Specific Lead", False, "No lead_id available")
        return
    
    try:
        response = make_request("GET", f"/leads/{lead_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if data["id"] == lead_id:
                log_test("Get Specific Lead", True, 
                        f"Lead retrieved: {data['name']}")
            else:
                log_test("Get Specific Lead", False, 
                        "Lead ID mismatch")
        else:
            log_test("Get Specific Lead", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Specific Lead", False, f"Exception: {str(e)}")

def test_12_update_lead():
    """Test 12: PUT /api/leads/{id} - Update lead"""
    if not lead_id:
        log_test("Update Lead", False, "No lead_id available")
        return
    
    try:
        update_data = {
            "name": "Carlos Rodríguez",
            "email": "carlos.rodriguez@email.com",
            "phone": "+56 9 5555 1234",
            "interest_type": "compra",
            "budget": 180000000,
            "status": "contactado",
            "source": "web",
            "notes": "Contactado - Programar visita para próxima semana"
        }
        response = make_request("PUT", f"/leads/{lead_id}", 
                              data=update_data, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if data["status"] == "contactado":
                log_test("Update Lead", True, 
                        "Lead updated successfully")
            else:
                log_test("Update Lead", False, 
                        "Update not reflected in response")
        else:
            log_test("Update Lead", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Lead", False, f"Exception: {str(e)}")

# ==================== PROPERTIES TESTS ====================

def test_14_create_property():
    """Test 14: POST /api/properties - Create property (with client_id)"""
    global property_id
    
    print("\n" + "="*60)
    print("PROPERTIES TESTS")
    print("="*60)
    
    if not client_id:
        log_test("Create Property", False, "No client_id available")
        return
    
    try:
        property_data = {
            "client_id": client_id,
            "title": "Hermoso Departamento en Las Condes",
            "address": "Av. Apoquindo 4500",
            "city": "Las Condes, Santiago",
            "price": 185000000,
            "property_type": "apartamento",
            "transaction_type": "venta",
            "status": "disponible",
            "bedrooms": 3,
            "bathrooms": 2,
            "area_m2": 95.5,
            "parking_spots": 2,
            "description": "Departamento moderno con vista panorámica",
            "features": ["Terraza", "Bodega", "Gimnasio", "Piscina"],
            "images": []
        }
        response = make_request("POST", "/properties", data=property_data, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and data["client_id"] == client_id:
                property_id = data["id"]
                log_test("Create Property", True, 
                        f"Property created successfully. ID: {property_id}")
            else:
                log_test("Create Property", False, 
                        "Response missing property ID or client_id mismatch")
        else:
            log_test("Create Property", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Property", False, f"Exception: {str(e)}")

def test_15_get_all_properties():
    """Test 15: GET /api/properties - Get all properties"""
    try:
        response = make_request("GET", "/properties", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get All Properties", True, 
                        f"Retrieved {len(data)} properties")
            else:
                log_test("Get All Properties", False, 
                        "Response is not a list")
        else:
            log_test("Get All Properties", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Properties", False, f"Exception: {str(e)}")

def test_16_get_properties_by_client():
    """Test 16: GET /api/properties/client/{client_id} - Get properties by client"""
    if not client_id:
        log_test("Get Properties by Client", False, "No client_id available")
        return
    
    try:
        response = make_request("GET", f"/properties/client/{client_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Properties by Client", True, 
                        f"Retrieved {len(data)} properties for client")
            else:
                log_test("Get Properties by Client", False, 
                        "Response is not a list")
        else:
            log_test("Get Properties by Client", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Properties by Client", False, f"Exception: {str(e)}")

def test_17_get_specific_property():
    """Test 17: GET /api/properties/{id} - Get specific property"""
    if not property_id:
        log_test("Get Specific Property", False, "No property_id available")
        return
    
    try:
        response = make_request("GET", f"/properties/{property_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if data["id"] == property_id:
                log_test("Get Specific Property", True, 
                        f"Property retrieved: {data['title']}")
            else:
                log_test("Get Specific Property", False, 
                        "Property ID mismatch")
        else:
            log_test("Get Specific Property", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Specific Property", False, f"Exception: {str(e)}")

def test_18_update_property():
    """Test 18: PUT /api/properties/{id} - Update property"""
    if not property_id or not client_id:
        log_test("Update Property", False, "No property_id or client_id available")
        return
    
    try:
        update_data = {
            "client_id": client_id,
            "title": "Hermoso Departamento en Las Condes - PRECIO REBAJADO",
            "address": "Av. Apoquindo 4500",
            "city": "Las Condes, Santiago",
            "price": 175000000,
            "property_type": "apartamento",
            "transaction_type": "venta",
            "status": "reservada",
            "bedrooms": 3,
            "bathrooms": 2,
            "area_m2": 95.5,
            "parking_spots": 2,
            "description": "Departamento moderno con vista panorámica - Oportunidad única",
            "features": ["Terraza", "Bodega", "Gimnasio", "Piscina", "Seguridad 24/7"],
            "images": []
        }
        response = make_request("PUT", f"/properties/{property_id}", 
                              data=update_data, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if data["status"] == "reservada" and data["price"] == 175000000:
                log_test("Update Property", True, 
                        "Property updated successfully")
            else:
                log_test("Update Property", False, 
                        "Update not reflected in response")
        else:
            log_test("Update Property", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Property", False, f"Exception: {str(e)}")

# ==================== APPOINTMENTS TESTS ====================

def test_20_create_appointment():
    """Test 20: POST /api/appointments - Create appointment"""
    global appointment_id
    
    print("\n" + "="*60)
    print("APPOINTMENTS TESTS")
    print("="*60)
    
    try:
        # Create appointment for 2 days from now
        appointment_time = datetime.utcnow() + timedelta(days=2)
        
        appointment_data = {
            "title": "Visita Propiedad Las Condes",
            "description": "Mostrar departamento a cliente potencial",
            "appointment_type": "visita",
            "related_entity": "property",
            "related_id": property_id if property_id else None,
            "date_time": appointment_time.isoformat(),
            "duration_minutes": 60,
            "notes": "Llevar planos y documentación"
        }
        response = make_request("POST", "/appointments", data=appointment_data, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data:
                appointment_id = data["id"]
                log_test("Create Appointment", True, 
                        f"Appointment created successfully. ID: {appointment_id}")
            else:
                log_test("Create Appointment", False, 
                        "Response missing appointment ID")
        else:
            log_test("Create Appointment", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Appointment", False, f"Exception: {str(e)}")

def test_21_get_all_appointments():
    """Test 21: GET /api/appointments - Get all appointments"""
    try:
        response = make_request("GET", "/appointments", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get All Appointments", True, 
                        f"Retrieved {len(data)} appointments")
            else:
                log_test("Get All Appointments", False, 
                        "Response is not a list")
        else:
            log_test("Get All Appointments", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Appointments", False, f"Exception: {str(e)}")

def test_22_get_upcoming_appointments():
    """Test 22: GET /api/appointments/upcoming - Get upcoming appointments"""
    try:
        response = make_request("GET", "/appointments/upcoming", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Upcoming Appointments", True, 
                        f"Retrieved {len(data)} upcoming appointments")
            else:
                log_test("Get Upcoming Appointments", False, 
                        "Response is not a list")
        else:
            log_test("Get Upcoming Appointments", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Upcoming Appointments", False, f"Exception: {str(e)}")

def test_23_get_specific_appointment():
    """Test 23: GET /api/appointments/{id} - Get specific appointment"""
    if not appointment_id:
        log_test("Get Specific Appointment", False, "No appointment_id available")
        return
    
    try:
        response = make_request("GET", f"/appointments/{appointment_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if data["id"] == appointment_id:
                log_test("Get Specific Appointment", True, 
                        f"Appointment retrieved: {data['title']}")
            else:
                log_test("Get Specific Appointment", False, 
                        "Appointment ID mismatch")
        else:
            log_test("Get Specific Appointment", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Specific Appointment", False, f"Exception: {str(e)}")

def test_24_update_appointment():
    """Test 24: PUT /api/appointments/{id} - Update appointment"""
    if not appointment_id:
        log_test("Update Appointment", False, "No appointment_id available")
        return
    
    try:
        # Update appointment for 3 days from now
        appointment_time = datetime.utcnow() + timedelta(days=3)
        
        update_data = {
            "title": "Visita Propiedad Las Condes - CONFIRMADA",
            "description": "Mostrar departamento a cliente potencial - Cliente confirmó asistencia",
            "appointment_type": "visita",
            "related_entity": "property",
            "related_id": property_id if property_id else None,
            "date_time": appointment_time.isoformat(),
            "duration_minutes": 90,
            "notes": "Llevar planos, documentación y contrato de reserva"
        }
        response = make_request("PUT", f"/appointments/{appointment_id}", 
                              data=update_data, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if data["duration_minutes"] == 90:
                log_test("Update Appointment", True, 
                        "Appointment updated successfully")
            else:
                log_test("Update Appointment", False, 
                        "Update not reflected in response")
        else:
            log_test("Update Appointment", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Appointment", False, f"Exception: {str(e)}")

def test_25_update_appointment_status():
    """Test 25: PUT /api/appointments/{id}/status?status=completada - Update appointment status"""
    if not appointment_id:
        log_test("Update Appointment Status", False, "No appointment_id available")
        return
    
    try:
        response = make_request("PUT", f"/appointments/{appointment_id}/status", 
                              params={"status": "completada"}, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Update Appointment Status", True, 
                        "Appointment status updated successfully")
            else:
                log_test("Update Appointment Status", False, 
                        "Unexpected response format")
        else:
            log_test("Update Appointment Status", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Appointment Status", False, f"Exception: {str(e)}")

# ==================== DASHBOARD TESTS ====================

def test_27_get_activities():
    """Test 27: GET /api/activities?limit=20 - Get activities"""
    print("\n" + "="*60)
    print("DASHBOARD TESTS")
    print("="*60)
    
    try:
        response = make_request("GET", "/activities", params={"limit": 20}, use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Activities", True, 
                        f"Retrieved {len(data)} activities")
            else:
                log_test("Get Activities", False, 
                        "Response is not a list")
        else:
            log_test("Get Activities", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Activities", False, f"Exception: {str(e)}")

def test_28_get_dashboard_stats():
    """Test 28: GET /api/dashboard/stats - Get dashboard stats"""
    try:
        response = make_request("GET", "/dashboard/stats", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["total_clients", "total_leads", "total_properties", 
                             "active_properties", "upcoming_appointments", 
                             "leads_by_status", "properties_by_status"]
            
            if all(field in data for field in required_fields):
                log_test("Get Dashboard Stats", True, 
                        f"Stats: {data['total_clients']} clients, {data['total_leads']} leads, "
                        f"{data['total_properties']} properties")
            else:
                log_test("Get Dashboard Stats", False, 
                        "Response missing required fields")
        else:
            log_test("Get Dashboard Stats", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Dashboard Stats", False, f"Exception: {str(e)}")

# ==================== DELETE TESTS ====================

def test_26_delete_appointment():
    """Test 26: DELETE /api/appointments/{id} - Delete appointment"""
    print("\n" + "="*60)
    print("DELETE TESTS")
    print("="*60)
    
    if not appointment_id:
        log_test("Delete Appointment", False, "No appointment_id available")
        return
    
    try:
        response = make_request("DELETE", f"/appointments/{appointment_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Delete Appointment", True, 
                        "Appointment deleted successfully")
            else:
                log_test("Delete Appointment", False, 
                        "Unexpected response format")
        else:
            log_test("Delete Appointment", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Delete Appointment", False, f"Exception: {str(e)}")

def test_19_delete_property():
    """Test 19: DELETE /api/properties/{id} - Delete property"""
    if not property_id:
        log_test("Delete Property", False, "No property_id available")
        return
    
    try:
        response = make_request("DELETE", f"/properties/{property_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Delete Property", True, 
                        "Property deleted successfully")
            else:
                log_test("Delete Property", False, 
                        "Unexpected response format")
        else:
            log_test("Delete Property", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Delete Property", False, f"Exception: {str(e)}")

def test_13_delete_lead():
    """Test 13: DELETE /api/leads/{id} - Delete lead"""
    if not lead_id:
        log_test("Delete Lead", False, "No lead_id available")
        return
    
    try:
        response = make_request("DELETE", f"/leads/{lead_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Delete Lead", True, 
                        "Lead deleted successfully")
            else:
                log_test("Delete Lead", False, 
                        "Unexpected response format")
        else:
            log_test("Delete Lead", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Delete Lead", False, f"Exception: {str(e)}")

def test_08_delete_client():
    """Test 8: DELETE /api/clients/{id} - Delete client"""
    if not client_id:
        log_test("Delete Client", False, "No client_id available")
        return
    
    try:
        response = make_request("DELETE", f"/clients/{client_id}", use_auth=True)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Delete Client", True, 
                        "Client deleted successfully")
            else:
                log_test("Delete Client", False, 
                        "Unexpected response format")
        else:
            log_test("Delete Client", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Delete Client", False, f"Exception: {str(e)}")

# ==================== MAIN TEST RUNNER ====================

def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*60)
    print("REAL ESTATE CRM - BACKEND API TEST SUITE")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Agent: {TEST_AGENT['email']}")
    print("="*60)
    
    # Authentication Tests
    test_01_register_agent()
    if not auth_token:
        test_02_login_agent()
    if not auth_token:
        print("\n❌ CRITICAL: Cannot proceed without authentication token")
        return
    
    test_03_get_current_agent()
    
    # Clients Tests
    test_04_create_client()
    test_05_get_all_clients()
    test_06_get_specific_client()
    test_07_update_client()
    
    # Leads Tests
    test_09_create_lead()
    test_10_get_all_leads()
    test_11_get_specific_lead()
    test_12_update_lead()
    
    # Properties Tests
    test_14_create_property()
    test_15_get_all_properties()
    test_16_get_properties_by_client()
    test_17_get_specific_property()
    test_18_update_property()
    
    # Appointments Tests
    test_20_create_appointment()
    test_21_get_all_appointments()
    test_22_get_upcoming_appointments()
    test_23_get_specific_appointment()
    test_24_update_appointment()
    test_25_update_appointment_status()
    
    # Dashboard Tests
    test_27_get_activities()
    test_28_get_dashboard_stats()
    
    # Delete Tests (in reverse order of dependencies)
    test_26_delete_appointment()
    test_19_delete_property()
    test_13_delete_lead()
    test_08_delete_client()
    
    # Print Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {len(test_results['passed'])} ✅")
    print(f"Failed: {len(test_results['failed'])} ❌")
    print(f"Success Rate: {len(test_results['passed'])/test_results['total']*100:.1f}%")
    
    if test_results['failed']:
        print("\n❌ Failed Tests:")
        for test in test_results['failed']:
            print(f"   - {test}")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    run_all_tests()
