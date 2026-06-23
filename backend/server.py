from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import bcrypt
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== UTILITY FUNCTIONS ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_agent(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get the current authenticated agent from JWT token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        agent_id: str = payload.get("sub")
        if agent_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    agent = await db.agents.find_one({"_id": ObjectId(agent_id)})
    if agent is None:
        raise HTTPException(status_code=401, detail="Agent not found")
    
    return agent


# ==================== MODELS ====================

class AgentRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class AgentLogin(BaseModel):
    email: EmailStr
    password: str

class AgentResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    agent: AgentResponse

class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    nationality: Optional[str] = None
    notes: Optional[str] = None

class ClientResponse(BaseModel):
    id: str
    agent_id: str
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    nationality: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    properties_count: Optional[int] = 0

class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    interest_type: str  # "compra" | "arriendo"
    budget: Optional[float] = None
    status: str = "nuevo"  # "nuevo" | "contactado" | "visita_programada" | "negociacion" | "cerrado" | "perdido"
    source: str = "otro"  # "web" | "referido" | "llamada" | "redes_sociales" | "otro"
    notes: Optional[str] = None
    interested_properties: Optional[List[str]] = []  # Array de IDs de propiedades

class LeadResponse(BaseModel):
    id: str
    agent_id: str
    name: str
    email: Optional[str] = None
    phone: str
    interest_type: str
    budget: Optional[float] = None
    status: str
    source: str
    notes: Optional[str] = None
    created_at: datetime
    last_contact_date: Optional[datetime] = None
    interested_properties: Optional[List[str]] = []

class PropertyCreate(BaseModel):
    client_id: str
    title: str
    address: str
    city: str
    region: str
    price: float
    property_type: str  # "casa" | "apartamento" | "terreno" | "comercial" | "oficina"
    transaction_type: str  # "venta" | "arriendo"
    status: str = "disponible"  # "disponible" | "reservada" | "vendida" | "arrendada"
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_m2: Optional[float] = None
    parking_spots: Optional[int] = None
    description: Optional[str] = None
    features: Optional[List[str]] = []
    images: Optional[List[str]] = []  # base64 images

class PropertyResponse(BaseModel):
    id: str
    agent_id: str
    client_id: str
    client_name: Optional[str] = None
    title: str
    address: str
    city: str
    region: str
    price: float
    property_type: str
    transaction_type: str
    status: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_m2: Optional[float] = None
    parking_spots: Optional[int] = None
    description: Optional[str] = None
    features: Optional[List[str]] = []
    images: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime

class AppointmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    appointment_type: str  # "visita" | "reunion" | "llamada" | "otro"
    related_entity: Optional[str] = None  # "client" | "lead" | "property"
    related_id: Optional[str] = None
    date_time: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    agent_id: str
    title: str
    description: Optional[str] = None
    appointment_type: str
    related_entity: Optional[str] = None
    related_id: Optional[str] = None
    related_name: Optional[str] = None
    date_time: datetime
    duration_minutes: int
    status: str
    notes: Optional[str] = None
    created_at: datetime

class ActivityResponse(BaseModel):
    id: str
    agent_id: str
    type: str
    description: str
    related_entity: Optional[str] = None
    related_id: Optional[str] = None
    timestamp: datetime

class DashboardStats(BaseModel):
    total_clients: int
    total_leads: int
    total_properties: int
    active_properties: int
    upcoming_appointments: int
    leads_by_status: dict
    properties_by_status: dict


# ==================== HELPER FUNCTIONS ====================

async def create_activity(agent_id: str, activity_type: str, description: str, 
                         related_entity: Optional[str] = None, related_id: Optional[str] = None):
    """Create an activity entry in the timeline"""
    activity = {
        "agent_id": agent_id,
        "type": activity_type,
        "description": description,
        "related_entity": related_entity,
        "related_id": related_id,
        "timestamp": datetime.utcnow()
    }
    await db.activities.insert_one(activity)


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(agent_data: AgentRegister):
    """Register a new agent"""
    # Check if email already exists
    existing_agent = await db.agents.find_one({"email": agent_data.email})
    if existing_agent:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new agent
    agent_dict = {
        "name": agent_data.name,
        "email": agent_data.email,
        "phone": agent_data.phone,
        "password": hash_password(agent_data.password),
        "created_at": datetime.utcnow()
    }
    
    result = await db.agents.insert_one(agent_dict)
    agent_dict["_id"] = result.inserted_id
    
    # Create access token
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    
    # Create activity
    await create_activity(
        agent_id=str(result.inserted_id),
        activity_type="agent_registered",
        description=f"Agente {agent_data.name} se registró en el sistema"
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        agent=AgentResponse(
            id=str(result.inserted_id),
            name=agent_dict["name"],
            email=agent_dict["email"],
            phone=agent_dict["phone"],
            created_at=agent_dict["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: AgentLogin):
    """Login an agent"""
    agent = await db.agents.find_one({"email": credentials.email})
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, agent["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": str(agent["_id"])})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        agent=AgentResponse(
            id=str(agent["_id"]),
            name=agent["name"],
            email=agent["email"],
            phone=agent["phone"],
            created_at=agent["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=AgentResponse)
async def get_current_agent_info(agent = Depends(get_current_agent)):
    """Get current agent information"""
    return AgentResponse(
        id=str(agent["_id"]),
        name=agent["name"],
        email=agent["email"],
        phone=agent["phone"],
        created_at=agent["created_at"]
    )


# ==================== CLIENTS ROUTES ====================

@api_router.get("/clients", response_model=List[ClientResponse])
async def get_clients(agent = Depends(get_current_agent)):
    """Get all clients for the current agent"""
    agent_id = str(agent["_id"])
    clients = await db.clients.find({"agent_id": agent_id}).to_list(1000)
    
    result = []
    for client in clients:
        # Count properties for each client
        properties_count = await db.properties.count_documents({"client_id": str(client["_id"])})
        result.append(ClientResponse(
            id=str(client["_id"]),
            agent_id=client["agent_id"],
            name=client["name"],
            email=client.get("email"),
            phone=client["phone"],
            address=client.get("address"),
            nationality=client.get("nationality"),
            notes=client.get("notes"),
            created_at=client["created_at"],
            properties_count=properties_count
        ))
    
    return result

@api_router.post("/clients", response_model=ClientResponse)
async def create_client(client_data: ClientCreate, agent = Depends(get_current_agent)):
    """Create a new client"""
    agent_id = str(agent["_id"])
    
    client_dict = {
        "agent_id": agent_id,
        "name": client_data.name,
        "email": client_data.email,
        "phone": client_data.phone,
        "address": client_data.address,
        "nationality": client_data.nationality,
        "notes": client_data.notes,
        "created_at": datetime.utcnow()
    }
    
    result = await db.clients.insert_one(client_dict)
    client_dict["_id"] = result.inserted_id
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="client_added",
        description=f"Nuevo cliente agregado: {client_data.name}",
        related_entity="client",
        related_id=str(result.inserted_id)
    )
    
    return ClientResponse(
        id=str(result.inserted_id),
        agent_id=agent_id,
        name=client_dict["name"],
        email=client_dict.get("email"),
        phone=client_dict["phone"],
        address=client_dict.get("address"),
        nationality=client_dict.get("nationality"),
        notes=client_dict.get("notes"),
        created_at=client_dict["created_at"],
        properties_count=0
    )

@api_router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(client_id: str, agent = Depends(get_current_agent)):
    """Get a specific client"""
    agent_id = str(agent["_id"])
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    properties_count = await db.properties.count_documents({"client_id": client_id})
    
    return ClientResponse(
        id=str(client["_id"]),
        agent_id=client["agent_id"],
        name=client["name"],
        email=client.get("email"),
        phone=client["phone"],
        address=client.get("address"),
        nationality=client.get("nationality"),
        notes=client.get("notes"),
        created_at=client["created_at"],
        properties_count=properties_count
    )

@api_router.put("/clients/{client_id}", response_model=ClientResponse)
async def update_client(client_id: str, client_data: ClientCreate, agent = Depends(get_current_agent)):
    """Update a client"""
    agent_id = str(agent["_id"])
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_dict = {
        "name": client_data.name,
        "email": client_data.email,
        "phone": client_data.phone,
        "address": client_data.address,
        "nationality": client_data.nationality,
        "notes": client_data.notes
    }
    
    await db.clients.update_one(
        {"_id": ObjectId(client_id)},
        {"$set": update_dict}
    )
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="client_updated",
        description=f"Cliente actualizado: {client_data.name}",
        related_entity="client",
        related_id=client_id
    )
    
    properties_count = await db.properties.count_documents({"client_id": client_id})
    
    return ClientResponse(
        id=client_id,
        agent_id=agent_id,
        name=update_dict["name"],
        email=update_dict.get("email"),
        phone=update_dict["phone"],
        address=update_dict.get("address"),
        nationality=update_dict.get("nationality"),
        notes=update_dict.get("notes"),
        created_at=client["created_at"],
        properties_count=properties_count
    )

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, agent = Depends(get_current_agent)):
    """Delete a client"""
    agent_id = str(agent["_id"])
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check if client has properties
    properties_count = await db.properties.count_documents({"client_id": client_id})
    if properties_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete client with associated properties")
    
    await db.clients.delete_one({"_id": ObjectId(client_id)})
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="client_deleted",
        description=f"Cliente eliminado: {client['name']}"
    )
    
    return {"message": "Client deleted successfully"}


# ==================== LEADS ROUTES ====================

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(agent = Depends(get_current_agent)):
    """Get all leads for the current agent"""
    agent_id = str(agent["_id"])
    leads = await db.leads.find({"agent_id": agent_id}).to_list(1000)
    
    return [LeadResponse(
        id=str(lead["_id"]),
        agent_id=lead["agent_id"],
        name=lead["name"],
        email=lead.get("email"),
        phone=lead["phone"],
        interest_type=lead["interest_type"],
        budget=lead.get("budget"),
        status=lead["status"],
        source=lead["source"],
        notes=lead.get("notes"),
        created_at=lead["created_at"],
        last_contact_date=lead.get("last_contact_date"),
        interested_properties=lead.get("interested_properties", [])
    ) for lead in leads]

@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(lead_data: LeadCreate, agent = Depends(get_current_agent)):
    """Create a new lead"""
    agent_id = str(agent["_id"])
    
    lead_dict = {
        "agent_id": agent_id,
        "name": lead_data.name,
        "email": lead_data.email,
        "phone": lead_data.phone,
        "interest_type": lead_data.interest_type,
        "budget": lead_data.budget,
        "status": lead_data.status,
        "source": lead_data.source,
        "notes": lead_data.notes,
        "interested_properties": lead_data.interested_properties or [],
        "created_at": datetime.utcnow(),
        "last_contact_date": None
    }
    
    result = await db.leads.insert_one(lead_dict)
    lead_dict["_id"] = result.inserted_id
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="lead_added",
        description=f"Nuevo lead agregado: {lead_data.name} ({lead_data.interest_type})",
        related_entity="lead",
        related_id=str(result.inserted_id)
    )
    
    return LeadResponse(
        id=str(result.inserted_id),
        agent_id=agent_id,
        name=lead_dict["name"],
        email=lead_dict.get("email"),
        phone=lead_dict["phone"],
        interest_type=lead_dict["interest_type"],
        budget=lead_dict.get("budget"),
        status=lead_dict["status"],
        source=lead_dict["source"],
        notes=lead_dict.get("notes"),
        created_at=lead_dict["created_at"],
        last_contact_date=lead_dict.get("last_contact_date"),
        interested_properties=lead_dict.get("interested_properties", [])
    )

@api_router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, agent = Depends(get_current_agent)):
    """Get a specific lead"""
    agent_id = str(agent["_id"])
    
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid lead ID")
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return LeadResponse(
        id=str(lead["_id"]),
        agent_id=lead["agent_id"],
        name=lead["name"],
        email=lead.get("email"),
        phone=lead["phone"],
        interest_type=lead["interest_type"],
        budget=lead.get("budget"),
        status=lead["status"],
        source=lead["source"],
        notes=lead.get("notes"),
        created_at=lead["created_at"],
        last_contact_date=lead.get("last_contact_date"),
        interested_properties=lead.get("interested_properties", [])
    )

@api_router.put("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: str, lead_data: LeadCreate, agent = Depends(get_current_agent)):
    """Update a lead"""
    agent_id = str(agent["_id"])
    
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid lead ID")
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_dict = {
        "name": lead_data.name,
        "email": lead_data.email,
        "phone": lead_data.phone,
        "interest_type": lead_data.interest_type,
        "budget": lead_data.budget,
        "status": lead_data.status,
        "source": lead_data.source,
        "notes": lead_data.notes,
        "interested_properties": lead_data.interested_properties or [],
        "last_contact_date": datetime.utcnow()
    }
    
    await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": update_dict}
    )
    
    # Create activity if status changed
    if lead["status"] != lead_data.status:
        await create_activity(
            agent_id=agent_id,
            activity_type="lead_status_changed",
            description=f"Lead {lead_data.name}: {lead['status']} → {lead_data.status}",
            related_entity="lead",
            related_id=lead_id
        )
    
    return LeadResponse(
        id=lead_id,
        agent_id=agent_id,
        name=update_dict["name"],
        email=update_dict.get("email"),
        phone=update_dict["phone"],
        interest_type=update_dict["interest_type"],
        budget=update_dict.get("budget"),
        status=update_dict["status"],
        source=update_dict["source"],
        notes=update_dict.get("notes"),
        created_at=lead["created_at"],
        last_contact_date=update_dict["last_contact_date"],
        interested_properties=update_dict.get("interested_properties", [])
    )

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, agent = Depends(get_current_agent)):
    """Delete a lead"""
    agent_id = str(agent["_id"])
    
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid lead ID")
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    await db.leads.delete_one({"_id": ObjectId(lead_id)})
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="lead_deleted",
        description=f"Lead eliminado: {lead['name']}"
    )
    
    return {"message": "Lead deleted successfully"}


# ==================== PROPERTIES ROUTES ====================

@api_router.get("/properties", response_model=List[PropertyResponse])
async def get_properties(agent = Depends(get_current_agent)):
    """Get all properties for the current agent"""
    agent_id = str(agent["_id"])
    properties = await db.properties.find({"agent_id": agent_id}).to_list(1000)
    
    result = []
    for prop in properties:
        # Get client name
        client = await db.clients.find_one({"_id": ObjectId(prop["client_id"])})
        client_name = client["name"] if client else "Unknown"
        
        result.append(PropertyResponse(
            id=str(prop["_id"]),
            agent_id=prop["agent_id"],
            client_id=prop["client_id"],
            client_name=client_name,
            title=prop["title"],
            address=prop["address"],
            city=prop["city"],
            region=prop.get("region", ""),
            price=prop["price"],
            property_type=prop["property_type"],
            transaction_type=prop["transaction_type"],
            status=prop["status"],
            bedrooms=prop.get("bedrooms"),
            bathrooms=prop.get("bathrooms"),
            area_m2=prop.get("area_m2"),
            parking_spots=prop.get("parking_spots"),
            description=prop.get("description"),
            features=prop.get("features", []),
            images=prop.get("images", []),
            created_at=prop["created_at"],
            updated_at=prop["updated_at"]
        ))
    
    return result

@api_router.post("/properties", response_model=PropertyResponse)
async def create_property(property_data: PropertyCreate, agent = Depends(get_current_agent)):
    """Create a new property"""
    agent_id = str(agent["_id"])
    
    # Verify client exists and belongs to agent
    try:
        client = await db.clients.find_one({"_id": ObjectId(property_data.client_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    property_dict = {
        "agent_id": agent_id,
        "client_id": property_data.client_id,
        "title": property_data.title,
        "address": property_data.address,
        "city": property_data.city,
        "region": property_data.region,
        "price": property_data.price,
        "property_type": property_data.property_type,
        "transaction_type": property_data.transaction_type,
        "status": property_data.status,
        "bedrooms": property_data.bedrooms,
        "bathrooms": property_data.bathrooms,
        "area_m2": property_data.area_m2,
        "parking_spots": property_data.parking_spots,
        "description": property_data.description,
        "features": property_data.features,
        "images": property_data.images,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.properties.insert_one(property_dict)
    property_dict["_id"] = result.inserted_id
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="property_added",
        description=f"Nueva propiedad agregada: {property_data.title} ({client['name']})",
        related_entity="property",
        related_id=str(result.inserted_id)
    )
    
    return PropertyResponse(
        id=str(result.inserted_id),
        agent_id=agent_id,
        client_id=property_data.client_id,
        client_name=client["name"],
        title=property_dict["title"],
        address=property_dict["address"],
        city=property_dict["city"],
        region=property_dict["region"],
        price=property_dict["price"],
        property_type=property_dict["property_type"],
        transaction_type=property_dict["transaction_type"],
        status=property_dict["status"],
        bedrooms=property_dict.get("bedrooms"),
        bathrooms=property_dict.get("bathrooms"),
        area_m2=property_dict.get("area_m2"),
        parking_spots=property_dict.get("parking_spots"),
        description=property_dict.get("description"),
        features=property_dict.get("features", []),
        images=property_dict.get("images", []),
        created_at=property_dict["created_at"],
        updated_at=property_dict["updated_at"]
    )

@api_router.get("/properties/client/{client_id}", response_model=List[PropertyResponse])
async def get_properties_by_client(client_id: str, agent = Depends(get_current_agent)):
    """Get all properties for a specific client"""
    agent_id = str(agent["_id"])
    
    # Verify client exists and belongs to agent
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    properties = await db.properties.find({"client_id": client_id}).to_list(1000)
    
    return [PropertyResponse(
        id=str(prop["_id"]),
        agent_id=prop["agent_id"],
        client_id=prop["client_id"],
        client_name=client["name"],
        title=prop["title"],
        address=prop["address"],
        city=prop["city"],
        region=prop.get("region", ""),
        price=prop["price"],
        property_type=prop["property_type"],
        transaction_type=prop["transaction_type"],
        status=prop["status"],
        bedrooms=prop.get("bedrooms"),
        bathrooms=prop.get("bathrooms"),
        area_m2=prop.get("area_m2"),
        parking_spots=prop.get("parking_spots"),
        description=prop.get("description"),
        features=prop.get("features", []),
        images=prop.get("images", []),
        created_at=prop["created_at"],
        updated_at=prop["updated_at"]
    ) for prop in properties]

@api_router.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str, agent = Depends(get_current_agent)):
    """Get a specific property"""
    agent_id = str(agent["_id"])
    
    try:
        prop = await db.properties.find_one({"_id": ObjectId(property_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid property ID")
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get client name
    client = await db.clients.find_one({"_id": ObjectId(prop["client_id"])})
    client_name = client["name"] if client else "Unknown"
    
    return PropertyResponse(
        id=str(prop["_id"]),
        agent_id=prop["agent_id"],
        client_id=prop["client_id"],
        client_name=client_name,
        title=prop["title"],
        address=prop["address"],
        city=prop["city"],
        region=prop.get("region", ""),
        price=prop["price"],
        property_type=prop["property_type"],
        transaction_type=prop["transaction_type"],
        status=prop["status"],
        bedrooms=prop.get("bedrooms"),
        bathrooms=prop.get("bathrooms"),
        area_m2=prop.get("area_m2"),
        parking_spots=prop.get("parking_spots"),
        description=prop.get("description"),
        features=prop.get("features", []),
        images=prop.get("images", []),
        created_at=prop["created_at"],
        updated_at=prop["updated_at"]
    )

@api_router.put("/properties/{property_id}", response_model=PropertyResponse)
async def update_property(property_id: str, property_data: PropertyCreate, agent = Depends(get_current_agent)):
    """Update a property"""
    agent_id = str(agent["_id"])
    
    try:
        prop = await db.properties.find_one({"_id": ObjectId(property_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid property ID")
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Verify client exists and belongs to agent
    try:
        client = await db.clients.find_one({"_id": ObjectId(property_data.client_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_dict = {
        "client_id": property_data.client_id,
        "title": property_data.title,
        "address": property_data.address,
        "city": property_data.city,
        "region": property_data.region,
        "price": property_data.price,
        "property_type": property_data.property_type,
        "transaction_type": property_data.transaction_type,
        "status": property_data.status,
        "bedrooms": property_data.bedrooms,
        "bathrooms": property_data.bathrooms,
        "area_m2": property_data.area_m2,
        "parking_spots": property_data.parking_spots,
        "description": property_data.description,
        "features": property_data.features,
        "images": property_data.images,
        "updated_at": datetime.utcnow()
    }
    
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": update_dict}
    )
    
    # Create activity if status changed
    if prop["status"] != property_data.status:
        await create_activity(
            agent_id=agent_id,
            activity_type="property_status_changed",
            description=f"Propiedad {property_data.title}: {prop['status']} → {property_data.status}",
            related_entity="property",
            related_id=property_id
        )
    
    return PropertyResponse(
        id=property_id,
        agent_id=agent_id,
        client_id=update_dict["client_id"],
        client_name=client["name"],
        title=update_dict["title"],
        address=update_dict["address"],
        city=update_dict["city"],
        region=update_dict["region"],
        price=update_dict["price"],
        property_type=update_dict["property_type"],
        transaction_type=update_dict["transaction_type"],
        status=update_dict["status"],
        bedrooms=update_dict.get("bedrooms"),
        bathrooms=update_dict.get("bathrooms"),
        area_m2=update_dict.get("area_m2"),
        parking_spots=update_dict.get("parking_spots"),
        description=update_dict.get("description"),
        features=update_dict.get("features", []),
        images=update_dict.get("images", []),
        created_at=prop["created_at"],
        updated_at=update_dict["updated_at"]
    )

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, agent = Depends(get_current_agent)):
    """Delete a property"""
    agent_id = str(agent["_id"])
    
    try:
        prop = await db.properties.find_one({"_id": ObjectId(property_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid property ID")
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    await db.properties.delete_one({"_id": ObjectId(property_id)})
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="property_deleted",
        description=f"Propiedad eliminada: {prop['title']}"
    )
    
    return {"message": "Property deleted successfully"}


# ==================== APPOINTMENTS ROUTES ====================

@api_router.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(agent = Depends(get_current_agent)):
    """Get all appointments for the current agent"""
    agent_id = str(agent["_id"])
    appointments = await db.appointments.find({"agent_id": agent_id}).to_list(1000)
    
    result = []
    for appt in appointments:
        related_name = None
        if appt.get("related_entity") and appt.get("related_id"):
            if appt["related_entity"] == "client":
                related = await db.clients.find_one({"_id": ObjectId(appt["related_id"])})
                related_name = related["name"] if related else None
            elif appt["related_entity"] == "lead":
                related = await db.leads.find_one({"_id": ObjectId(appt["related_id"])})
                related_name = related["name"] if related else None
            elif appt["related_entity"] == "property":
                related = await db.properties.find_one({"_id": ObjectId(appt["related_id"])})
                related_name = related["title"] if related else None
        
        result.append(AppointmentResponse(
            id=str(appt["_id"]),
            agent_id=appt["agent_id"],
            title=appt["title"],
            description=appt.get("description"),
            appointment_type=appt["appointment_type"],
            related_entity=appt.get("related_entity"),
            related_id=appt.get("related_id"),
            related_name=related_name,
            date_time=appt["date_time"],
            duration_minutes=appt["duration_minutes"],
            status=appt["status"],
            notes=appt.get("notes"),
            created_at=appt["created_at"]
        ))
    
    return result

@api_router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(appointment_data: AppointmentCreate, agent = Depends(get_current_agent)):
    """Create a new appointment"""
    agent_id = str(agent["_id"])
    
    appointment_dict = {
        "agent_id": agent_id,
        "title": appointment_data.title,
        "description": appointment_data.description,
        "appointment_type": appointment_data.appointment_type,
        "related_entity": appointment_data.related_entity,
        "related_id": appointment_data.related_id,
        "date_time": appointment_data.date_time,
        "duration_minutes": appointment_data.duration_minutes,
        "status": "programada",
        "notes": appointment_data.notes,
        "created_at": datetime.utcnow()
    }
    
    result = await db.appointments.insert_one(appointment_dict)
    appointment_dict["_id"] = result.inserted_id
    
    # Create activity
    date_str = appointment_data.date_time.strftime("%d/%m/%Y %H:%M")
    await create_activity(
        agent_id=agent_id,
        activity_type="appointment_created",
        description=f"Cita programada: {appointment_data.title} ({date_str})",
        related_entity="appointment",
        related_id=str(result.inserted_id)
    )
    
    # Get related name
    related_name = None
    if appointment_data.related_entity and appointment_data.related_id:
        if appointment_data.related_entity == "client":
            related = await db.clients.find_one({"_id": ObjectId(appointment_data.related_id)})
            related_name = related["name"] if related else None
        elif appointment_data.related_entity == "lead":
            related = await db.leads.find_one({"_id": ObjectId(appointment_data.related_id)})
            related_name = related["name"] if related else None
        elif appointment_data.related_entity == "property":
            related = await db.properties.find_one({"_id": ObjectId(appointment_data.related_id)})
            related_name = related["title"] if related else None
    
    return AppointmentResponse(
        id=str(result.inserted_id),
        agent_id=agent_id,
        title=appointment_dict["title"],
        description=appointment_dict.get("description"),
        appointment_type=appointment_dict["appointment_type"],
        related_entity=appointment_dict.get("related_entity"),
        related_id=appointment_dict.get("related_id"),
        related_name=related_name,
        date_time=appointment_dict["date_time"],
        duration_minutes=appointment_dict["duration_minutes"],
        status=appointment_dict["status"],
        notes=appointment_dict.get("notes"),
        created_at=appointment_dict["created_at"]
    )

@api_router.get("/appointments/upcoming")
async def get_upcoming_appointments(agent = Depends(get_current_agent)):
    """Get upcoming appointments (next 7 days)"""
    agent_id = str(agent["_id"])
    now = datetime.utcnow()
    week_later = now + timedelta(days=7)
    
    appointments = await db.appointments.find({
        "agent_id": agent_id,
        "date_time": {"$gte": now, "$lte": week_later},
        "status": "programada"
    }).sort("date_time", 1).to_list(100)
    
    result = []
    for appt in appointments:
        related_name = None
        if appt.get("related_entity") and appt.get("related_id"):
            if appt["related_entity"] == "client":
                related = await db.clients.find_one({"_id": ObjectId(appt["related_id"])})
                related_name = related["name"] if related else None
            elif appt["related_entity"] == "lead":
                related = await db.leads.find_one({"_id": ObjectId(appt["related_id"])})
                related_name = related["name"] if related else None
            elif appt["related_entity"] == "property":
                related = await db.properties.find_one({"_id": ObjectId(appt["related_id"])})
                related_name = related["title"] if related else None
        
        result.append(AppointmentResponse(
            id=str(appt["_id"]),
            agent_id=appt["agent_id"],
            title=appt["title"],
            description=appt.get("description"),
            appointment_type=appt["appointment_type"],
            related_entity=appt.get("related_entity"),
            related_id=appt.get("related_id"),
            related_name=related_name,
            date_time=appt["date_time"],
            duration_minutes=appt["duration_minutes"],
            status=appt["status"],
            notes=appt.get("notes"),
            created_at=appt["created_at"]
        ))
    
    return result

@api_router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: str, agent = Depends(get_current_agent)):
    """Get a specific appointment"""
    agent_id = str(agent["_id"])
    
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Get related name
    related_name = None
    if appt.get("related_entity") and appt.get("related_id"):
        if appt["related_entity"] == "client":
            related = await db.clients.find_one({"_id": ObjectId(appt["related_id"])})
            related_name = related["name"] if related else None
        elif appt["related_entity"] == "lead":
            related = await db.leads.find_one({"_id": ObjectId(appt["related_id"])})
            related_name = related["name"] if related else None
        elif appt["related_entity"] == "property":
            related = await db.properties.find_one({"_id": ObjectId(appt["related_id"])})
            related_name = related["title"] if related else None
    
    return AppointmentResponse(
        id=str(appt["_id"]),
        agent_id=appt["agent_id"],
        title=appt["title"],
        description=appt.get("description"),
        appointment_type=appt["appointment_type"],
        related_entity=appt.get("related_entity"),
        related_id=appt.get("related_id"),
        related_name=related_name,
        date_time=appt["date_time"],
        duration_minutes=appt["duration_minutes"],
        status=appt["status"],
        notes=appt.get("notes"),
        created_at=appt["created_at"]
    )

@api_router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: str, appointment_data: AppointmentCreate, agent = Depends(get_current_agent)):
    """Update an appointment"""
    agent_id = str(agent["_id"])
    
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_dict = {
        "title": appointment_data.title,
        "description": appointment_data.description,
        "appointment_type": appointment_data.appointment_type,
        "related_entity": appointment_data.related_entity,
        "related_id": appointment_data.related_id,
        "date_time": appointment_data.date_time,
        "duration_minutes": appointment_data.duration_minutes,
        "notes": appointment_data.notes
    }
    
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": update_dict}
    )
    
    # Get related name
    related_name = None
    if appointment_data.related_entity and appointment_data.related_id:
        if appointment_data.related_entity == "client":
            related = await db.clients.find_one({"_id": ObjectId(appointment_data.related_id)})
            related_name = related["name"] if related else None
        elif appointment_data.related_entity == "lead":
            related = await db.leads.find_one({"_id": ObjectId(appointment_data.related_id)})
            related_name = related["name"] if related else None
        elif appointment_data.related_entity == "property":
            related = await db.properties.find_one({"_id": ObjectId(appointment_data.related_id)})
            related_name = related["title"] if related else None
    
    return AppointmentResponse(
        id=appointment_id,
        agent_id=agent_id,
        title=update_dict["title"],
        description=update_dict.get("description"),
        appointment_type=update_dict["appointment_type"],
        related_entity=update_dict.get("related_entity"),
        related_id=update_dict.get("related_id"),
        related_name=related_name,
        date_time=update_dict["date_time"],
        duration_minutes=update_dict["duration_minutes"],
        status=appt["status"],
        notes=update_dict.get("notes"),
        created_at=appt["created_at"]
    )

@api_router.put("/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: str = Query(...), agent = Depends(get_current_agent)):
    """Update appointment status"""
    agent_id = str(agent["_id"])
    
    if status not in ["programada", "completada", "cancelada"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": status}}
    )
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="appointment_status_changed",
        description=f"Cita {appt['title']}: {appt['status']} → {status}",
        related_entity="appointment",
        related_id=appointment_id
    )
    
    return {"message": "Appointment status updated successfully"}

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, agent = Depends(get_current_agent)):
    """Delete an appointment"""
    agent_id = str(agent["_id"])
    
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id), "agent_id": agent_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    await db.appointments.delete_one({"_id": ObjectId(appointment_id)})
    
    # Create activity
    await create_activity(
        agent_id=agent_id,
        activity_type="appointment_deleted",
        description=f"Cita eliminada: {appt['title']}"
    )
    
    return {"message": "Appointment deleted successfully"}


# ==================== ACTIVITIES ROUTES ====================

@api_router.get("/activities", response_model=List[ActivityResponse])
async def get_activities(limit: int = 50, agent = Depends(get_current_agent)):
    """Get recent activities for the current agent"""
    agent_id = str(agent["_id"])
    activities = await db.activities.find({"agent_id": agent_id}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return [ActivityResponse(
        id=str(activity["_id"]),
        agent_id=activity["agent_id"],
        type=activity["type"],
        description=activity["description"],
        related_entity=activity.get("related_entity"),
        related_id=activity.get("related_id"),
        timestamp=activity["timestamp"]
    ) for activity in activities]


# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(agent = Depends(get_current_agent)):
    """Get dashboard statistics for the current agent"""
    agent_id = str(agent["_id"])
    
    # Count totals
    total_clients = await db.clients.count_documents({"agent_id": agent_id})
    total_leads = await db.leads.count_documents({"agent_id": agent_id})
    total_properties = await db.properties.count_documents({"agent_id": agent_id})
    active_properties = await db.properties.count_documents({"agent_id": agent_id, "status": "disponible"})
    
    # Count upcoming appointments (next 7 days)
    now = datetime.utcnow()
    week_later = now + timedelta(days=7)
    upcoming_appointments = await db.appointments.count_documents({
        "agent_id": agent_id,
        "date_time": {"$gte": now, "$lte": week_later},
        "status": "programada"
    })
    
    # Leads by status
    leads_by_status = {}
    for status in ["nuevo", "contactado", "visita_programada", "negociacion", "cerrado", "perdido"]:
        count = await db.leads.count_documents({"agent_id": agent_id, "status": status})
        leads_by_status[status] = count
    
    # Properties by status
    properties_by_status = {}
    for status in ["disponible", "reservada", "vendida", "arrendada"]:
        count = await db.properties.count_documents({"agent_id": agent_id, "status": status})
        properties_by_status[status] = count
    
    return DashboardStats(
        total_clients=total_clients,
        total_leads=total_leads,
        total_properties=total_properties,
        active_properties=active_properties,
        upcoming_appointments=upcoming_appointments,
        leads_by_status=leads_by_status,
        properties_by_status=properties_by_status
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
