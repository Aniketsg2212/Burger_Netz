from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import base64
import sqlite3

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DB_PATH = ROOT_DIR / 'burgernetz.db'

JWT_SECRET = os.environ.get('JWT_SECRET', 'burgernetz-secret-key-2024')
JWT_ALGORITHM = 'HS256'

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ================== DATABASE SETUP ==================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        photos TEXT DEFAULT '[]',
        status TEXT DEFAULT 'pending',
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )''')
    conn.commit()
    conn.close()

# ================== MODELS ==================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None

class IssueUpdate(BaseModel):
    status: Optional[str] = None

class IssueResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    photos: List[str] = []
    status: str
    user_id: str
    user_name: str
    created_at: str
    updated_at: str

class AnalyticsResponse(BaseModel):
    total_issues: int
    by_category: dict
    by_status: dict
    recent_issues: List[IssueResponse]
    monthly_trends: List[dict]

# ================== HELPERS ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 7
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def row_to_issue(row) -> IssueResponse:
    import json
    d = dict(row)
    d['photos'] = json.loads(d.get('photos') or '[]')
    return IssueResponse(**d)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: sqlite3.Connection = Depends(get_db)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = db.execute('SELECT * FROM users WHERE id = ?', (payload['user_id'],)).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        return dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: sqlite3.Connection = Depends(get_db)):
    existing = db.execute('SELECT id FROM users WHERE email = ?', (user_data.email,)).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    db.execute('INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
               (user_id, user_data.name, user_data.email, hash_password(user_data.password), now))
    db.commit()

    token = create_token(user_id, user_data.email)
    return TokenResponse(token=token, user=UserResponse(id=user_id, name=user_data.name, email=user_data.email, created_at=now))

@api_router.post("/auth/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    user = db.execute('SELECT * FROM users WHERE email = ?', (login_data.email,)).fetchone()
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid email or password')

    token = create_token(user['id'], user['email'])
    return TokenResponse(token=token, user=UserResponse(id=user['id'], name=user['name'], email=user['email'], created_at=user['created_at']))

@api_router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(id=current_user['id'], name=current_user['name'], email=current_user['email'], created_at=current_user['created_at'])

# ================== ISSUE ROUTES ==================

@api_router.post("/issues", response_model=IssueResponse)
def create_issue(issue_data: IssueCreate, current_user: dict = Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    import json
    issue_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    db.execute('''INSERT INTO issues (id, title, description, category, latitude, longitude, address, photos, status, user_id, user_name, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
               (issue_id, issue_data.title, issue_data.description, issue_data.category,
                issue_data.latitude, issue_data.longitude, issue_data.address,
                json.dumps([]), 'pending', current_user['id'], current_user['name'], now, now))
    db.commit()

    row = db.execute('SELECT * FROM issues WHERE id = ?', (issue_id,)).fetchone()
    return row_to_issue(row)

@api_router.post("/issues/{issue_id}/photos")
def upload_photo(issue_id: str, photo: UploadFile = File(...), current_user: dict = Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    import json
    issue = db.execute('SELECT * FROM issues WHERE id = ?', (issue_id,)).fetchone()
    if not issue:
        raise HTTPException(status_code=404, detail='Issue not found')
    if issue['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail='Not authorized')

    contents = photo.file.read()
    base64_photo = base64.b64encode(contents).decode('utf-8')
    photo_data = f"data:{photo.content_type};base64,{base64_photo}"

    photos = json.loads(issue['photos'] or '[]')
    photos.append(photo_data)

    db.execute('UPDATE issues SET photos = ?, updated_at = ? WHERE id = ?',
               (json.dumps(photos), datetime.now(timezone.utc).isoformat(), issue_id))
    db.commit()
    return {'message': 'Photo uploaded successfully', 'photo': photo_data}

@api_router.get("/issues", response_model=List[IssueResponse])
def get_issues(category: Optional[str] = None, status: Optional[str] = None, user_id: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    query = 'SELECT * FROM issues WHERE 1=1'
    params = []
    if category:
        query += ' AND category = ?'
        params.append(category)
    if status:
        query += ' AND status = ?'
        params.append(status)
    if user_id:
        query += ' AND user_id = ?'
        params.append(user_id)
    query += ' ORDER BY created_at DESC'
    rows = db.execute(query, params).fetchall()
    return [row_to_issue(r) for r in rows]

@api_router.get("/issues/{issue_id}", response_model=IssueResponse)
def get_issue(issue_id: str, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute('SELECT * FROM issues WHERE id = ?', (issue_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail='Issue not found')
    return row_to_issue(row)

@api_router.patch("/issues/{issue_id}", response_model=IssueResponse)
def update_issue(issue_id: str, update_data: IssueUpdate, current_user: dict = Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    issue = db.execute('SELECT * FROM issues WHERE id = ?', (issue_id,)).fetchone()
    if not issue:
        raise HTTPException(status_code=404, detail='Issue not found')

    now = datetime.now(timezone.utc).isoformat()
    if update_data.status:
        db.execute('UPDATE issues SET status = ?, updated_at = ? WHERE id = ?', (update_data.status, now, issue_id))
    else:
        db.execute('UPDATE issues SET updated_at = ? WHERE id = ?', (now, issue_id))
    db.commit()

    row = db.execute('SELECT * FROM issues WHERE id = ?', (issue_id,)).fetchone()
    return row_to_issue(row)

@api_router.delete("/issues/{issue_id}")
def delete_issue(issue_id: str, current_user: dict = Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    issue = db.execute('SELECT * FROM issues WHERE id = ?', (issue_id,)).fetchone()
    if not issue:
        raise HTTPException(status_code=404, detail='Issue not found')
    if issue['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail='Not authorized')
    db.execute('DELETE FROM issues WHERE id = ?', (issue_id,))
    db.commit()
    return {'message': 'Issue deleted successfully'}

# ================== ANALYTICS ROUTES ==================

@api_router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(db: sqlite3.Connection = Depends(get_db)):
    total = db.execute('SELECT COUNT(*) FROM issues').fetchone()[0]

    by_category = {cat: db.execute('SELECT COUNT(*) FROM issues WHERE category = ?', (cat,)).fetchone()[0]
                   for cat in ['pothole', 'streetlight', 'garbage', 'graffiti', 'other']}

    by_status = {s: db.execute('SELECT COUNT(*) FROM issues WHERE status = ?', (s,)).fetchone()[0]
                 for s in ['pending', 'in_progress', 'resolved']}

    recent_rows = db.execute('SELECT * FROM issues ORDER BY created_at DESC LIMIT 5').fetchall()

    now = datetime.now(timezone.utc)
    monthly_trends = []
    for i in range(5, -1, -1):
        month = now.month - i
        year = now.year
        if month <= 0:
            month += 12
            year -= 1
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc) if month == 12 else datetime(year, month + 1, 1, tzinfo=timezone.utc)
        count = db.execute('SELECT COUNT(*) FROM issues WHERE created_at >= ? AND created_at < ?',
                           (start.isoformat(), end.isoformat())).fetchone()[0]
        monthly_trends.append({'month': start.strftime('%b %Y'), 'count': count})

    return AnalyticsResponse(
        total_issues=total,
        by_category=by_category,
        by_status=by_status,
        recent_issues=[row_to_issue(r) for r in recent_rows],
        monthly_trends=monthly_trends
    )

# ================== BASE ROUTES ==================

@api_router.get("/")
def root():
    return {"message": "BurgerNetz API", "version": "1.0.0"}

@api_router.get("/health")
def health():
    return {"status": "healthy"}

app.include_router(api_router)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

init_db()
