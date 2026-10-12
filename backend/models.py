import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'lawyer' or 'client'
    phone = Column(String, nullable=True)
    specialization = Column(String, default="General Practice") # For lawyers: Criminal, Corporate, Civil, Constitutional
    experience_years = Column(Integer, default=5)
    consultation_fee = Column(String, default="₹1,500 / session")
    bar_registration = Column(String, nullable=True) # Bar Council ID
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    lawyer_cases = relationship("Case", foreign_keys="Case.lawyer_id", back_populates="lawyer")
    client_cases = relationship("Case", foreign_keys="Case.client_id", back_populates="client")
    lawyer_appointments = relationship("Appointment", foreign_keys="Appointment.lawyer_id", back_populates="lawyer")
    client_appointments = relationship("Appointment", foreign_keys="Appointment.client_id", back_populates="client")
    uploaded_documents = relationship("Document", back_populates="uploader")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    case_number = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    sections = Column(String, nullable=True) # e.g. "Sec 303 BNS, Sec 324 BNS"
    status = Column(String, default="Active") # Active, Hearing Scheduled, In Review, Disposed
    hearing_date = Column(String, nullable=True)
    courtroom = Column(String, nullable=True)
    next_step = Column(String, default="Written Statement Submission")
    progress_percent = Column(Integer, default=30)
    
    lawyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lawyer = relationship("User", foreign_keys=[lawyer_id], back_populates="lawyer_cases")
    client = relationship("User", foreign_keys=[client_id], back_populates="client_cases")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    logs = relationship("CaseLog", back_populates="case", cascade="all, delete-orphan")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    lawyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    
    appointment_date = Column(String, nullable=False) # e.g. "2026-10-15"
    time_slot = Column(String, nullable=False) # e.g. "11:00 AM - 12:00 PM"
    matter = Column(String, nullable=False) # Consultation Topic
    status = Column(String, default="Pending") # Pending, Confirmed, Rejected, Completed
    notes = Column(Text, nullable=True)
    meeting_link = Column(String, default="https://meet.jit.si/NyayaChambers-Consultation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lawyer = relationship("User", foreign_keys=[lawyer_id], back_populates="lawyer_appointments")
    client = relationship("User", foreign_keys=[client_id], back_populates="client_appointments")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False) # S3 or local storage URL
    file_size = Column(String, default="1.2 MB")
    file_type = Column(String, default="PDF")
    
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_shared_with_client = Column(Boolean, default=True)
    
    # AI Document Reader / RAG analysis cache
    ai_summary = Column(Text, nullable=True)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="documents")
    uploader = relationship("User", back_populates="uploaded_documents")


class CaseLog(Base):
    __tablename__ = "case_logs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    stage_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="logs")
