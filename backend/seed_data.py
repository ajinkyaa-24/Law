from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models
from auth import get_password_hash

def seed_initial_data():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        if db.query(models.User).first():
            # Already seeded
            return

        print("Seeding initial chamber data...")
        
        # 1. Lawyers
        lawyer_1 = models.User(
            email="advocate.sharma@nyayachambers.in",
            hashed_password=get_password_hash("lawyer123"),
            full_name="Adv. Rajesh Sharma",
            role="lawyer",
            phone="+91 98112 34567",
            specialization="Criminal Law & BNS Defense",
            experience_years=14,
            consultation_fee="₹2,500 / session",
            bar_registration="D/1842/2012 (Bar Council of Delhi)",
            bio="Senior advocate specializing in Bharatiya Nyaya Sanhita, white-collar financial crimes, and bail applications in the High Court of Delhi."
        )
        lawyer_2 = models.User(
            email="advocate.mehta@nyayachambers.in",
            hashed_password=get_password_hash("lawyer123"),
            full_name="Adv. Ananya Mehta",
            role="lawyer",
            phone="+91 98223 45678",
            specialization="Corporate, Contracts & IP",
            experience_years=9,
            consultation_fee="₹3,000 / session",
            bar_registration="MAH/4021/2017 (Bombay Bar Council)",
            bio="Specialist in founder vesting agreements, venture funding contracts, and commercial arbitration."
        )
        lawyer_3 = models.User(
            email="advocate.khan@nyayachambers.in",
            hashed_password=get_password_hash("lawyer123"),
            full_name="Adv. Tariq Khan",
            role="lawyer",
            phone="+91 98334 56789",
            specialization="Constitutional & Civil Writs",
            experience_years=18,
            consultation_fee="₹4,000 / session",
            bar_registration="UP/1299/2008 (Allahabad Bar)",
            bio="Arguing counsel at the Supreme Court of India dealing with fundamental rights violations and Special Leave Petitions (SLPs)."
        )
        db.add_all([lawyer_1, lawyer_2, lawyer_3])
        db.commit()

        # 2. Clients
        client_1 = models.User(
            email="client.ramesh@gmail.com",
            hashed_password=get_password_hash("client123"),
            full_name="Ramesh Kumar",
            role="client",
            phone="+91 98765 43210",
            bio="Individual litigant facing property trespass and theft dispute."
        )
        client_2 = models.User(
            email="client.priya@gmail.com",
            hashed_password=get_password_hash("client123"),
            full_name="Priya Sharma",
            role="client",
            phone="+91 87654 32109",
            bio="Digital entrepreneur pursuing social media defamation and extortion matter."
        )
        db.add_all([client_1, client_2])
        db.commit()

        # 3. Cases
        case_1 = models.Case(
            title="Property Encroachment & Trespass Dispute",
            case_number="CRL-HC-2026-0492",
            description="Land boundary trespass and theft of survey markers by commercial neighbor at Sector 62.",
            sections="Sec 303 BNS (Theft), Sec 329 BNS (House Trespass)",
            status="Active",
            hearing_date="2026-10-28",
            courtroom="Courtroom 4, High Court of Delhi",
            next_step="Filing Rejoinder to Counter-Affidavit",
            progress_percent=65,
            lawyer_id=lawyer_1.id,
            client_id=client_1.id
        )
        case_2 = models.Case(
            title="Online Defamation & Extortion Complaint",
            case_number="CC-JMFC-2026-1184",
            description="Defamation suit and criminal intimidation via forged WhatsApp communications.",
            sections="Sec 356 BNS (Defamation), Sec 351(2) BNS (Criminal Intimidation)",
            status="Hearing Scheduled",
            hearing_date="2026-11-04",
            courtroom="Courtroom 12, Tis Hazari Courts",
            next_step="Cross-examination of Prosecution Witness 1",
            progress_percent=40,
            lawyer_id=lawyer_1.id,
            client_id=client_2.id
        )
        db.add_all([case_1, case_2])
        db.commit()

        # 4. Appointments
        apt_1 = models.Appointment(
            lawyer_id=lawyer_1.id,
            client_id=client_1.id,
            case_id=case_1.id,
            appointment_date="2026-10-20",
            time_slot="04:00 PM - 05:00 PM",
            matter="Pre-hearing Strategy Conference for Property Encroachment",
            status="Confirmed",
            notes="Please bring original registry deed and municipal survey report."
        )
        apt_2 = models.Appointment(
            lawyer_id=lawyer_2.id,
            client_id=client_2.id,
            appointment_date="2026-10-22",
            time_slot="11:30 AM - 12:30 PM",
            matter="Review of Founder Non-Disclosure Agreement",
            status="Pending",
            notes="Awaiting confirmation from Adv. Ananya Mehta."
        )
        db.add_all([apt_1, apt_2])
        db.commit()

        # 5. Documents
        doc_1 = models.Document(
            title="Boundary Survey & Site Inspection Report",
            file_name="Boundary_Survey_Map_2026.pdf",
            file_url="https://nyaya-chambers-documents.s3.amazonaws.com/cases/Boundary_Survey_Map_2026.pdf",
            file_size="2.4 MB",
            file_type="PDF",
            case_id=case_1.id,
            uploaded_by_id=lawyer_1.id,
            is_shared_with_client=True,
            ai_summary="Certified surveyor report confirming 4.2 meter encroachment by respondents on northern boundary."
        )
        doc_2 = models.Document(
            title="Formal Legal Notice under Section 35(3) BNSS",
            file_name="Legal_Notice_Respondent_1.pdf",
            file_url="https://nyaya-chambers-documents.s3.amazonaws.com/cases/Legal_Notice_Respondent_1.pdf",
            file_size="640 KB",
            file_type="PDF",
            case_id=case_1.id,
            uploaded_by_id=lawyer_1.id,
            is_shared_with_client=True,
            ai_summary="Statutory pre-litigation notice served via registered post with acknowledgment due."
        )
        db.add_all([doc_1, doc_2])
        db.commit()

        print("Database successfully seeded with realistic chamber data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_initial_data()
