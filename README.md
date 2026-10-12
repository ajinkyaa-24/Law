# Nyaya Chambers - Legal AI Hub & Practice Suite

A web-based chamber operations and legal intelligence system designed for advocates and litigants. The platform streamlines litigation tracking, client dossiers, hearing calendars, and document analysis, with support for the new Bharatiya Nyaya Sanhita (BNS, 2023) statutory framework.

---

## 1. Project Overview

Managing case files, client communications, hearing dates, and statutory analysis manually across paper files or generic spreadsheets is slow and error-prone for practicing lawyers. Litigants often lack real-time visibility into their hearing progress and case documents.

**Nyaya Chambers** addresses this by providing:
- A role-based interface separating **Advocate Practice Management** from the **Client Self-Service Portal**.
- Centralized litigation registers for tracking courtrooms, hearing dates, next steps, and fee ledgers.
- An in-app document reader that extracts text and audits legal risks from uploaded briefs, contracts, and FIRs (.pdf and .docx) without triggering device downloads.
- A statutory inference module mapping factual incident descriptions directly to relevant provisions under the BNS 2023, BNSS 2023, and IPC equivalents.

---

## 2. System Architecture

The application follows a decoupled three-tier architecture:

```
[ Frontend: React 19 + Vite ]
             │
             │ REST APIs / JSON / Multipart
             ▼
[ Backend: FastAPI (Python 3.12) ]
   ├── Authentication: JWT + Passlib (Bcrypt)
   ├── ORM & Models: SQLAlchemy 2.0
   ├── NLP / AI: Scikit-Learn (TF-IDF), pypdf, xml.etree
   └── File Storage: Local Vault (/backend/uploads/)
             │
             ▼
[ Database: SQLite (nyaya_chambers.db) ]
```

---

## 3. Tech Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 8
- **Icons:** React Icons (`react-icons/fi`)
- **Styling:** Custom CSS with dark-mode theme variables (no external CSS framework)
- **HTTP Client:** Native Fetch API with Bearer token authentication

### Backend
- **Framework:** FastAPI (0.115)
- **Server:** Uvicorn ASGI
- **Data Validation:** Pydantic v2
- **ORM:** SQLAlchemy 2.0
- **Database:** SQLite (embedded relational storage; easily swappable with PostgreSQL)
- **Security:** JWT (`python-jose`) with HS256 algorithm and salted Bcrypt hashing (`passlib`)

### Machine Learning & Document Parsing
- **Classification:** Scikit-Learn (`TfidfVectorizer`, Logistic Regression, Cosine Similarity)
- **PDF Extraction:** `pypdf`
- **DOCX Extraction:** Standard library `zipfile` & `xml.etree.ElementTree` parser
- **Legal Dataset:** Trained mapping catalog across IPC 1860, BNS 2023, BNSS 2023, and special acts (NI Act, Specific Relief Act)

---

## 4. Key Modules & Features

### 1. Role-Based Authentication
- Isolated role workflows for **Lawyers** and **Clients**.
- Protected API routes verified via JWT authorization headers.

### 2. Litigation & Client Manager (Advocate Suite)
- Maintain client dossiers with active case matters and contact records.
- Track upcoming courtroom appearances and next procedural steps.
- Log billing ledgers and fee structures (retainer, per-hearing).
- Upload and attach case exhibits (.pdf, .docx, .txt).

### 3. In-App Document Reader & Analysis
- Server-side text extraction for PDF and Word (.docx) files.
- Statutory citation extraction (identifies BNS, IPC, BNSS, and constitutional articles).
- Clause risk detection with severity tags (*High Attention Needed*, *Moderate Review Advised*, *Standard*).
- Formatted in-app reading modal so documents can be reviewed directly in the browser without downloading files to the local machine.

### 4. Situation Analyzer
- Allows litigants or junior advocates to input case facts in natural language.
- Generates legal classifications, primary offenses, bail status (Bailable / Non-bailable), cognizable status, and immediate procedural remedies.

### 5. Client Portal
- Real-time hearing status tracking for clients.
- Consultation booking by date and available time slot.
- Access to shared court filings in the verified document vault.

---

## 5. Project Directory Structure

```
law/
├── backend/
│   ├── auth.py              # JWT generation, password hashing & RBAC dependencies
│   ├── database.py          # SQLAlchemy engine, session maker & SQLite connection
│   ├── model.py             # TF-IDF inference engine & statutory definitions
│   ├── models.py            # SQLAlchemy database tables (User, Case, Appointment, Document)
│   ├── rag_service.py       # PDF/DOCX extraction & legal risk audit engine
│   ├── requirements.txt     # Python dependency list
│   ├── seed_data.py         # Mock database seeding script
│   ├── server.py            # FastAPI route controllers and static mount
│   ├── training_data.py     # Legal training corpus for situation classification
│   └── uploads/             # Storage folder for case exhibits
│
├── src/
│   ├── components/
│   │   ├── AIDocumentReader.jsx   # Document viewer & RAG Q&A interface
│   │   ├── ClientDashboard.jsx    # Client self-service portal
│   │   ├── ClientManager.jsx      # Advocate client dossier & litigation manager
│   │   ├── SituationAnalyzer.jsx  # Natural language incident legal classifier
│   │   └── ...                    # Navigation, auth modal, and layout components
│   ├── services/
│   │   └── api.js                 # Unified frontend API service
│   ├── App.jsx                    # Root view router & role state management
│   ├── index.css                  # Global design tokens and component styles
│   └── main.jsx                   # React application mount
│
├── package.json             # Frontend dependencies and npm scripts
├── vite.config.js           # Vite server and build configuration
└── README.md
```

---

## 6. Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Python 3.10+
- pip and virtualenv

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# (Optional) Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python3 -m uvicorn server:app --reload --port 8000
```
Backend will start at: `http://localhost:8000`  
Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Frontend Setup
In a new terminal window:
```bash
# From project root
npm install

# Start Vite development server
npm run dev
```
Frontend will be available at: `http://localhost:5180` (or `http://localhost:5173`)

---

## 7. Demo Credentials

The database comes pre-seeded with sample user accounts for testing:

| Role | Email | Password |
|---|---|---|
| **Advocate (Lawyer)** | `ramesh.law@nyayachambers.in` | `lawyer123` |
| **Client (Litigant)** | `priya.client@nyayachambers.in` | `client123` |

New accounts can also be created directly via the **Register** tab on the login screen.

---

## 8. Team & Academic Details

- **Project:** Final Year Capstone Project
- **Domain:** Web Development / Artificial Intelligence & Legal Informatics
- **Academic Year:** 2025–2026
