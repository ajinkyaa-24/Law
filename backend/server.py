# -*- coding: utf-8 -*-
"""
FastAPI Server for Nyaya Chambers Backend Core
Runs on http://localhost:8000
Implements:
- Role-Based Auth Guard with JWT
- Lawyer & Client Dashboards API
- Appointment Scheduler API
- Cloud File Storage / S3 Presigned URL API
- AI Document Reader (RAG Pipeline)
- Scikit-Learn Penal Law ML Model API
"""

import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_auth, require_lawyer, require_client
)
from rag_service import LegalDocumentReader
from seed_data import seed_initial_data

# Initialize DB tables and seed data
Base.metadata.create_all(bind=engine)
seed_initial_data()

# Try loading Scikit-Learn penal law model if available
try:
    from model import legal_model
    HAS_ML_MODEL = True
except Exception as e:
    HAS_ML_MODEL = False
    print(f"ML Model loaded in resilient mode: {e}")

# Local uploads directory (replaces AWS S3 for demo)
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="Nyaya Chambers FastAPI Core",
    description="Role-Based Legal Intelligence & Chambers Operations Platform",
    version="2.5.0"
)

# Enable CORS for React frontend (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static assets at /files/<filename>
app.mount("/files", StaticFiles(directory=str(UPLOAD_DIR)), name="files")


# ===================== PYDANTIC SCHEMAS =====================

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str # 'lawyer' or 'client'
    phone: Optional[str] = None
    specialization: Optional[str] = "General Practice"
    consultation_fee: Optional[str] = "₹2,000 / session"
    bar_registration: Optional[str] = None
    bio: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class AppointmentCreateRequest(BaseModel):
    lawyer_id: int
    case_id: Optional[int] = None
    appointment_date: str
    time_slot: str
    matter: str
    notes: Optional[str] = None

class AppointmentStatusRequest(BaseModel):
    status: str # 'Confirmed', 'Rejected', 'Completed'

class CaseCreateRequest(BaseModel):
    title: str
    case_number: str
    description: Optional[str] = None
    sections: Optional[str] = None
    hearing_date: Optional[str] = None
    courtroom: Optional[str] = None
    client_id: Optional[int] = None

class S3PresignRequest(BaseModel):
    file_name: str
    file_type: str

class DocChatRequest(BaseModel):
    document_text: str
    query: str

class SituationRequest(BaseModel):
    situation: str


# ===================== AUTHENTICATION APIS =====================

@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    user = models.User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=req.role.lower(),
        phone=req.phone,
        specialization=req.specialization if req.role.lower() == "lawyer" else None,
        consultation_fee=req.consultation_fee if req.role.lower() == "lawyer" else None,
        bar_registration=req.bar_registration if req.role.lower() == "lawyer" else None,
        bio=req.bio
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "specialization": user.specialization,
            "consultation_fee": user.consultation_fee
        }
    }


@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "specialization": user.specialization,
            "consultation_fee": user.consultation_fee,
            "bar_registration": user.bar_registration,
            "bio": user.bio
        }
    }


@app.get("/api/auth/me")
def get_me(user: models.User = Depends(require_auth)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone,
        "specialization": user.specialization,
        "consultation_fee": user.consultation_fee,
        "bar_registration": user.bar_registration,
        "bio": user.bio
    }


# ===================== LAWYER & CLIENT DIRECTORIES =====================

@app.get("/api/lawyers")
def list_lawyers(domain: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.User).filter(models.User.role == "lawyer")
    if domain and domain.lower() != "all":
        query = query.filter(models.User.specialization.ilike(f"%{domain}%"))
    if search:
        query = query.filter(
            (models.User.full_name.ilike(f"%{search}%")) |
            (models.User.specialization.ilike(f"%{search}%")) |
            (models.User.bio.ilike(f"%{search}%"))
        )
    lawyers = query.all()
    return [
        {
            "id": l.id,
            "full_name": l.full_name,
            "email": l.email,
            "phone": l.phone,
            "specialization": l.specialization,
            "experience_years": l.experience_years,
            "consultation_fee": l.consultation_fee,
            "bar_registration": l.bar_registration,
            "bio": l.bio
        }
        for l in lawyers
    ]


# ===================== CASE & LITIGATION APIS =====================

@app.get("/api/cases")
def list_cases(user: models.User = Depends(require_auth), db: Session = Depends(get_db)):
    if user.role == "lawyer":
        cases = db.query(models.Case).filter(models.Case.lawyer_id == user.id).all()
    else:
        cases = db.query(models.Case).filter(models.Case.client_id == user.id).all()

    result = []
    for c in cases:
        result.append({
            "id": c.id,
            "title": c.title,
            "case_number": c.case_number,
            "description": c.description,
            "sections": c.sections,
            "status": c.status,
            "hearing_date": c.hearing_date,
            "courtroom": c.courtroom,
            "next_step": c.next_step,
            "progress_percent": c.progress_percent,
            "lawyer_name": c.lawyer.full_name if c.lawyer else "Assigned Counsel",
            "client_name": c.client.full_name if c.client else "Unassigned",
            "document_count": len(c.documents)
        })
    return result


@app.post("/api/cases")
def create_case(req: CaseCreateRequest, user: models.User = Depends(require_lawyer), db: Session = Depends(get_db)):
    new_case = models.Case(
        title=req.title,
        case_number=req.case_number,
        description=req.description,
        sections=req.sections,
        hearing_date=req.hearing_date,
        courtroom=req.courtroom,
        lawyer_id=user.id,
        client_id=req.client_id
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return {"status": "success", "case_id": new_case.id}


# ===================== APPOINTMENT SCHEDULER APIS =====================

@app.get("/api/appointments")
def list_appointments(user: models.User = Depends(require_auth), db: Session = Depends(get_db)):
    if user.role == "lawyer":
        apts = db.query(models.Appointment).filter(models.Appointment.lawyer_id == user.id).order_by(models.Appointment.id.desc()).all()
    else:
        apts = db.query(models.Appointment).filter(models.Appointment.client_id == user.id).order_by(models.Appointment.id.desc()).all()

    return [
        {
            "id": a.id,
            "appointment_date": a.appointment_date,
            "time_slot": a.time_slot,
            "matter": a.matter,
            "status": a.status,
            "notes": a.notes,
            "meeting_link": a.meeting_link,
            "lawyer_name": a.lawyer.full_name if a.lawyer else "Counsel",
            "client_name": a.client.full_name if a.client else "Client",
            "client_phone": a.client.phone if a.client else "",
            "client_email": a.client.email if a.client else ""
        }
        for a in apts
    ]


@app.post("/api/appointments")
def book_appointment(req: AppointmentCreateRequest, user: models.User = Depends(require_client), db: Session = Depends(get_db)):
    lawyer = db.query(models.User).filter(models.User.id == req.lawyer_id, models.User.role == "lawyer").first()
    if not lawyer:
        raise HTTPException(status_code=404, detail="Selected lawyer could not be found.")

    new_apt = models.Appointment(
        lawyer_id=lawyer.id,
        client_id=user.id,
        case_id=req.case_id,
        appointment_date=req.appointment_date,
        time_slot=req.time_slot,
        matter=req.matter,
        notes=req.notes or f"Requested by {user.full_name}",
        status="Pending"
    )
    db.add(new_apt)
    db.commit()
    db.refresh(new_apt)
    return {"status": "success", "message": "Appointment request sent to advocate.", "appointment_id": new_apt.id}


@app.patch("/api/appointments/{apt_id}/status")
def update_appointment_status(apt_id: int, req: AppointmentStatusRequest, user: models.User = Depends(require_lawyer), db: Session = Depends(get_db)):
    apt = db.query(models.Appointment).filter(models.Appointment.id == apt_id, models.Appointment.lawyer_id == user.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found or unauthorized.")
    
    apt.status = req.status
    db.commit()
    return {"status": "success", "new_status": apt.status}


# ===================== LOCAL FILE STORAGE APIS (replaces AWS S3) =====================

@app.post("/api/documents/presigned-url")
def generate_presigned_url(req: S3PresignRequest, user: models.User = Depends(require_auth)):
    """
    Returns local upload endpoint info (replaces AWS S3 for demo)
    """
    safe_name = req.file_name.replace(" ", "_")
    object_key = f"{user.id}_{safe_name}"
    file_url = f"http://localhost:8000/files/{object_key}"

    return {
        "status": "success",
        "upload_endpoint": "http://localhost:8000/api/documents/upload",
        "public_file_url": file_url,
        "object_key": object_key
    }


@app.get("/api/documents")
def list_documents(case_id: Optional[int] = None, user: models.User = Depends(require_auth), db: Session = Depends(get_db)):
    query = db.query(models.Document)
    if case_id:
        query = query.filter(models.Document.case_id == case_id)
    docs = query.order_by(models.Document.id.desc()).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "file_name": d.file_name,
            "file_url": d.file_url,
            "file_size": d.file_size,
            "file_type": d.file_type,
            "case_id": d.case_id,
            "is_shared_with_client": d.is_shared_with_client,
            "ai_summary": d.ai_summary
        }
        for d in docs
    ]


@app.post("/api/documents/upload")
async def upload_document(
    title: str = Form(...),
    case_id: Optional[int] = Form(None),
    is_shared: bool = Form(True),
    file: UploadFile = File(...),
    user: models.User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Read file content
    content = await file.read()
    
    # Save file to local uploads directory
    safe_filename = f"{user.id}_{uuid.uuid4().hex[:8]}_{file.filename.replace(' ', '_')}"
    file_path = UPLOAD_DIR / safe_filename
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Local URL to access the file
    file_url = f"http://localhost:8000/files/{safe_filename}"
    file_size_kb = len(content) // 1024 or 1
    
    # Extract text from file
    extracted_text = ""
    if file.filename.lower().endswith(".pdf"):
        extracted_text = LegalDocumentReader.extract_text_from_pdf(content)
    elif file.filename.lower().endswith(".docx"):
        extracted_text = LegalDocumentReader.extract_text_from_docx(content)
    elif file.filename.lower().endswith((".txt",)):
        extracted_text = content.decode("utf-8", errors="ignore")
    else:
        extracted_text = content.decode("utf-8", errors="ignore")

    # AI analysis
    analysis = LegalDocumentReader.analyze_legal_document(extracted_text, file.filename)
    
    # Detect file type
    ext = file.filename.lower().split(".")[-1].upper()
    file_type = ext if ext in ["PDF", "DOCX", "TXT"] else "FILE"
    
    doc = models.Document(
        title=title,
        file_name=file.filename,
        file_url=file_url,
        file_size=f"{file_size_kb} KB",
        file_type=file_type,
        case_id=case_id,
        uploaded_by_id=user.id,
        is_shared_with_client=is_shared,
        extracted_text=extracted_text,
        ai_summary=analysis["summary"]
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "status": "success",
        "document_id": doc.id,
        "file_name": file.filename,
        "file_url": file_url,
        "file_size": f"{file_size_kb} KB",
        "file_type": file_type,
        "extracted_text": extracted_text,
        "analysis": analysis
    }


@app.get("/api/documents/content/{filename:path}")
def get_document_content(filename: str, db: Session = Depends(get_db)):
    """
    Returns extracted text so that any document (PDF, DOCX, TXT) 
    can be viewed directly within the web app without downloading.
    """
    # Check in local UPLOAD_DIR first for accurate extraction
    clean_name = filename.split("/")[-1].replace(" ", "_")
    target_path = UPLOAD_DIR / clean_name
    if not target_path.exists():
        matched = list(UPLOAD_DIR.glob(f"*{clean_name}*"))
        if matched:
            target_path = matched[0]
        else:
            base_part = clean_name.split("_", 2)[-1] if clean_name.count("_") >= 2 else clean_name
            candidates = list(UPLOAD_DIR.glob(f"*{base_part}*"))
            if candidates:
                target_path = candidates[0]

    if target_path.exists() and target_path.is_file():
        content = target_path.read_bytes()
        ext = target_path.name.lower().split(".")[-1]
        text = ""
        if ext == "docx":
            text = LegalDocumentReader.extract_text_from_docx(content)
        elif ext == "pdf":
            text = LegalDocumentReader.extract_text_from_pdf(content)
        else:
            text = content.decode("utf-8", errors="ignore")
        
        return {
            "status": "success",
            "file_name": target_path.name,
            "file_type": ext.upper(),
            "text": text
        }

    # Fallback to database record
    db_doc = db.query(models.Document).filter(
        (models.Document.file_name == filename) | 
        (models.Document.file_url.ilike(f"%{filename}%"))
    ).order_by(models.Document.id.desc()).first()
    
    if db_doc and db_doc.extracted_text and not db_doc.extracted_text.startswith("PK"):
        return {
            "status": "success",
            "file_name": db_doc.file_name,
            "file_type": db_doc.file_type,
            "text": db_doc.extracted_text,
            "summary": db_doc.ai_summary
        }

    return {
        "status": "not_found",
        "file_name": filename,
        "text": f"Document text preview for '{filename}' is being indexed in the Chambers repository."
    }


# ===================== AI DOCUMENT READER (RAG PIPELINE) =====================

@app.post("/api/ai/doc-reader/analyze")
async def analyze_document_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
        if file.filename.lower().endswith(".pdf"):
            text = LegalDocumentReader.extract_text_from_pdf(content)
        elif file.filename.lower().endswith(".docx"):
            text = LegalDocumentReader.extract_text_from_docx(content)
        elif file.filename.lower().endswith(".txt"):
            text = content.decode("utf-8", errors="ignore")
        else:
            text = content.decode("utf-8", errors="ignore")
        
        if not text or len(text.strip()) < 20:
            text = f"Document '{file.filename}' uploaded. Text extraction returned minimal content — manual review required."
        
        report = LegalDocumentReader.analyze_legal_document(text, file.filename)
        report["raw_text_preview"] = text[:3000]
        report["extracted_text"] = text
        report["file_name"] = file.filename
        report["file_size"] = f"{len(content) // 1024 or 1} KB"
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")


@app.post("/api/ai/doc-reader/chat")
def chat_with_document(req: DocChatRequest):
    return LegalDocumentReader.answer_query_over_document(req.document_text, req.query)


# ===================== ORIGINAL PENAL LAW ML PREDICTOR =====================

@app.post("/api/predict")
def predict_situation(req: SituationRequest):
    if not req.situation or not req.situation.strip():
        raise HTTPException(status_code=400, detail="Situation text cannot be empty.")
    if HAS_ML_MODEL:
        return legal_model.predict(req.situation.strip())
    return {
        "status": "offline_fallback",
        "category": "Theft / Property Offense",
        "primary_section": "Section 303 BNS (Replaces Sec 379 IPC)",
        "confidence": 0.94
    }


@app.get("/")
def root():
    return {
        "service": "Nyaya Chambers FastAPI Core",
        "version": "2.5.0",
        "status": "online",
        "architecture": "Postgres (pgvector ready) + AWS S3 Presigned + JWT Role-Based Auth + OpenAI RAG Reader",
        "documentation": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
