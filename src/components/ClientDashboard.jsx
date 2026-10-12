import React, { useState, useEffect } from 'react';
import { 
  FiFileText, FiClock, FiCalendar, FiUser, FiSearch, FiCheckCircle, 
  FiAlertCircle, FiDownload, FiPlus, FiPhone, FiMail, FiBriefcase, 
  FiAward, FiExternalLink, FiVideo, FiFilter
} from 'react-icons/fi';
import { api } from '../services/api.js';

export default function ClientDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'files', 'appointments', 'lawyers'
  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [searchLawyer, setSearchLawyer] = useState('');
  const [filterDomain, setFilterDomain] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Appointment Booking Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedLawyerForBooking, setSelectedLawyerForBooking] = useState(null);
  const [bookDate, setBookDate] = useState('');
  const [bookTimeSlot, setBookTimeSlot] = useState('11:00 AM - 12:00 PM');
  const [bookMatter, setBookMatter] = useState('');
  const [bookNotes, setBookNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [casesData, aptsData, docsData, lawyersData] = await Promise.all([
        api.getCases(),
        api.getAppointments(),
        api.getDocuments(),
        api.getLawyers(filterDomain, searchLawyer)
      ]);
      setCases(casesData || []);
      setAppointments(aptsData || []);
      setDocuments(docsData || []);
      setLawyers(lawyersData || []);
    } catch (err) {
      console.error('Error fetching client dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDomain]);

  const handleSearchLawyers = async (e) => {
    e.preventDefault();
    try {
      const lawyersData = await api.getLawyers(filterDomain, searchLawyer);
      setLawyers(lawyersData || []);
    } catch (err) {
      console.error('Failed to search lawyers:', err);
    }
  };

  const handleOpenBooking = (lawyer) => {
    setSelectedLawyerForBooking(lawyer);
    setShowBookModal(true);
    setBookingSuccess('');
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!selectedLawyerForBooking || !bookDate || !bookMatter) return;

    try {
      await api.bookAppointment({
        lawyer_id: selectedLawyerForBooking.id,
        appointment_date: bookDate,
        time_slot: bookTimeSlot,
        matter: bookMatter,
        notes: bookNotes
      });
      setBookingSuccess('Appointment request successfully transmitted to advocate!');
      setTimeout(() => {
        setShowBookModal(false);
        setBookingSuccess('');
        setBookMatter('');
        setBookNotes('');
        loadData();
      }, 1500);
    } catch (err) {
      alert('Error booking appointment: ' + err.message);
    }
  };

  return (
    <div className="client-dashboard-container">
      {/* Client Header Welcome Banner */}
      <div className="client-banner">
        <div>
          <h2>Litigant Case Console & Legal Services</h2>
          <p>
            Welcome, <strong>{currentUser?.full_name || 'Client'}</strong> • Real-time case tracking, document custody, and advocate consultations.
          </p>
        </div>
        <div className="client-banner-actions">
          <button 
            className="client-primary-btn" 
            onClick={() => {
              if (lawyers.length > 0) handleOpenBooking(lawyers[0]);
              else setActiveTab('lawyers');
            }}
          >
            <FiCalendar /> Schedule Consultation
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="client-subnav-tabs">
        <button 
          className={`client-nav-btn ${activeTab === 'cases' ? 'active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          <FiFileText /> My Case Progress ({cases.length})
        </button>
        <button 
          className={`client-nav-btn ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FiDownload /> Shared Case Files ({documents.length})
        </button>
        <button 
          className={`client-nav-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <FiClock /> Scheduled Consultations ({appointments.length})
        </button>
        <button 
          className={`client-nav-btn ${activeTab === 'lawyers' ? 'active' : ''}`}
          onClick={() => setActiveTab('lawyers')}
        >
          <FiUser /> Find an Advocate ({lawyers.length})
        </button>
      </div>

      {/* TAB 1: VIEW CASE PROGRESS */}
      {activeTab === 'cases' && (
        <div className="client-tab-content">
          <div className="section-title-row">
            <h3>Active Judicial Proceedings</h3>
            <span className="badge">Updated from Court Registry</span>
          </div>

          {cases.length === 0 ? (
            <div className="empty-state-box">
              <FiFileText size={42} opacity={0.4} />
              <h4>No Active Cases Registered</h4>
              <p>You currently do not have any registered court matters linked to your account.</p>
              <button className="client-primary-btn" onClick={() => setActiveTab('lawyers')}>
                Consult a Lawyer to File a Case
              </button>
            </div>
          ) : (
            <div className="cases-progress-grid">
              {cases.map((c) => (
                <div key={c.id} className="case-progress-card">
                  <div className="case-card-header">
                    <div>
                      <span className="case-id-tag">{c.case_number}</span>
                      <h4>{c.title}</h4>
                    </div>
                    <span className={`status-pill ${c.status.toLowerCase().replace(' ', '-')}`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="case-desc">{c.description}</p>
                  
                  {c.sections && (
                    <div className="case-sections-tag">
                      <strong>Applicable Penal Sections:</strong> {c.sections}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="case-progress-tracker">
                    <div className="progress-labels">
                      <span>Judicial Progression</span>
                      <span>{c.progress_percent}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${c.progress_percent}%` }} />
                    </div>
                  </div>

                  {/* Milestone Details */}
                  <div className="case-details-table">
                    <div className="detail-item">
                      <span className="label"><FiCalendar /> Next Hearing Date:</span>
                      <span className="val highlight">{c.hearing_date || 'Awaiting Roster'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label"><FiAward /> Bench / Courtroom:</span>
                      <span className="val">{c.courtroom || 'Registry Allocation Pending'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label"><FiBriefcase /> Assigned Advocate:</span>
                      <span className="val">{c.lawyer_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label"><FiCheckCircle /> Next Procedural Step:</span>
                      <span className="val">{c.next_step}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHARED CASE FILES */}
      {activeTab === 'files' && (
        <div className="client-tab-content">
          <div className="section-title-row">
            <h3>Shared Judicial Documents & Evidence Vault</h3>
            <span className="badge">Encrypted Legal Vault</span>
          </div>

          <div className="client-docs-list">
            {documents.length === 0 ? (
              <div className="empty-state-box">
                <FiDownload size={42} opacity={0.4} />
                <p>No documents uploaded yet for your matter.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="client-doc-item">
                  <div className="doc-item-left">
                    <div className="doc-icon-box">PDF</div>
                    <div>
                      <h5>{doc.title}</h5>
                      <span className="doc-meta">
                        {doc.file_name} • {doc.file_size} • Verified Judicial File
                      </span>
                      {doc.ai_summary && (
                        <p className="doc-ai-summary">
                          <strong>AI Analysis:</strong> {doc.ai_summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <a 
                    href={doc.file_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="doc-download-btn"
                  >
                    <FiDownload /> Download Brief
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULED APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="client-tab-content">
          <div className="section-title-row">
            <h3>Advocate Consultations & Conferences</h3>
            <button className="client-primary-btn" onClick={() => setActiveTab('lawyers')}>
              <FiPlus /> New Appointment
            </button>
          </div>

          <div className="appointments-list-view">
            {appointments.length === 0 ? (
              <div className="empty-state-box">
                <FiClock size={42} opacity={0.4} />
                <h4>No Scheduled Consultations</h4>
                <p>Book a slot with an advocate to discuss your case strategy or legal queries.</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="apt-card">
                  <div className="apt-header">
                    <div>
                      <span className="apt-matter">{apt.matter}</span>
                      <p className="apt-lawyer">With <strong>{apt.lawyer_name}</strong></p>
                    </div>
                    <span className={`status-pill ${apt.status.toLowerCase()}`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="apt-meta-row">
                    <span><FiCalendar /> {apt.appointment_date}</span>
                    <span><FiClock /> {apt.time_slot}</span>
                    {apt.status === 'Confirmed' && (
                      <a 
                        href={apt.meeting_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="video-consult-btn"
                      >
                        <FiVideo /> Join Digital Chamber Video Room
                      </a>
                    )}
                  </div>
                  {apt.notes && <p className="apt-notes"><strong>Notes:</strong> {apt.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LAWYER SEARCH */}
      {activeTab === 'lawyers' && (
        <div className="client-tab-content">
          <div className="section-title-row">
            <h3>Advocate Directory & Bar Registry</h3>
            <div className="filters-bar">
              <select 
                value={filterDomain} 
                onChange={(e) => setFilterDomain(e.target.value)}
                className="domain-select"
              >
                <option value="All">All Domains</option>
                <option value="Criminal">Criminal Law & BNS</option>
                <option value="Corporate">Corporate & Contracts</option>
                <option value="Constitutional">Constitutional & Writs</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSearchLawyers} className="search-lawyer-bar">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search advocates by name, bar council registration, or keywords..."
              value={searchLawyer}
              onChange={(e) => setSearchLawyer(e.target.value)}
            />
            <button type="submit" className="search-submit-btn">Search Directory</button>
          </form>

          <div className="lawyers-grid">
            {lawyers.map((lawyer) => (
              <div key={lawyer.id} className="lawyer-profile-card">
                <div className="lawyer-card-top">
                  <div className="lawyer-avatar">
                    {lawyer.full_name.replace('Adv. ', '').charAt(0)}
                  </div>
                  <div>
                    <h4>{lawyer.full_name}</h4>
                    <span className="lawyer-spec">{lawyer.specialization}</span>
                  </div>
                </div>

                <p className="lawyer-bio">{lawyer.bio}</p>

                <div className="lawyer-stats-row">
                  <div>
                    <span className="stat-label">Experience</span>
                    <span className="stat-val">{lawyer.experience_years} Years</span>
                  </div>
                  <div>
                    <span className="stat-label">Consultation</span>
                    <span className="stat-val">{lawyer.consultation_fee}</span>
                  </div>
                  <div>
                    <span className="stat-label">Bar Enrollment</span>
                    <span className="stat-val">{lawyer.bar_registration || 'Verified'}</span>
                  </div>
                </div>

                <div className="lawyer-card-footer">
                  <button 
                    className="book-consult-btn"
                    onClick={() => handleOpenBooking(lawyer)}
                  >
                    <FiCalendar /> Book Consultation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPOINTMENT BOOKING MODAL */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal-content booking-modal">
            <div className="modal-header">
              <h3>Book Legal Consultation</h3>
              <button className="close-btn" onClick={() => setShowBookModal(false)}>×</button>
            </div>

            {bookingSuccess ? (
              <div className="booking-success-box">
                <FiCheckCircle size={48} color="#2ecc71" />
                <h4>Consultation Requested!</h4>
                <p>{bookingSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="booking-form">
                <div className="modal-target-lawyer">
                  <span>Consulting with:</span>
                  <strong>{selectedLawyerForBooking?.full_name}</strong>
                  <em>({selectedLawyerForBooking?.specialization})</em>
                </div>

                <div className="input-group">
                  <label>Consultation Date</label>
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Preferred Time Slot</label>
                  <select 
                    value={bookTimeSlot} 
                    onChange={(e) => setBookTimeSlot(e.target.value)}
                  >
                    <option>10:00 AM - 11:00 AM</option>
                    <option>11:30 AM - 12:30 PM</option>
                    <option>02:00 PM - 03:00 PM</option>
                    <option>04:00 PM - 05:00 PM</option>
                    <option>06:00 PM - 07:00 PM</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Legal Matter / Topic</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Property Trespass Advice or Bail Strategy"
                    value={bookMatter}
                    onChange={(e) => setBookMatter(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Summary Notes / Incident Facts (Optional)</label>
                  <textarea 
                    rows={3} 
                    placeholder="Briefly describe your situation so the advocate can prepare the bare act provisions..."
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowBookModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="confirm-btn">
                    Confirm Consultation Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
