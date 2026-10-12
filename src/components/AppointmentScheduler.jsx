import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiClock, FiUser, FiCheck, FiX, FiVideo, 
  FiPhone, FiMail, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import { api } from '../services/api.js';

export default function AppointmentScheduler() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      loadAppointments();
    } catch (err) {
      alert('Error updating appointment status: ' + err.message);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'All') return true;
    return a.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <div>
          <h2><FiCalendar /> Chamber Appointment Scheduler</h2>
          <p>Manage consultation requests, client conferences, and pre-trial strategy sessions.</p>
        </div>
        <div className="filter-pill-group">
          {['All', 'Pending', 'Confirmed', 'Completed'].map((tab) => (
            <button
              key={tab}
              className={`filter-pill-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Refreshing consultation calendar...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="empty-state-box">
          <FiCalendar size={44} opacity={0.4} />
          <h4>No Appointments in this Category</h4>
          <p>Any incoming consultation bookings from litigants will appear here.</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="scheduler-card">
              <div className="scheduler-card-top">
                <div className="client-info-block">
                  <div className="client-avatar-circle">
                    <FiUser />
                  </div>
                  <div>
                    <h4>{apt.client_name}</h4>
                    <span className="client-contact-sub">
                      {apt.client_email} {apt.client_phone && `• ${apt.client_phone}`}
                    </span>
                  </div>
                </div>
                <span className={`status-pill ${apt.status.toLowerCase()}`}>
                  {apt.status}
                </span>
              </div>

              <div className="scheduler-matter-box">
                <label>Consultation Subject:</label>
                <strong>{apt.matter}</strong>
              </div>

              <div className="scheduler-datetime-row">
                <div>
                  <FiCalendar /> <span>{apt.appointment_date}</span>
                </div>
                <div>
                  <FiClock /> <span>{apt.time_slot}</span>
                </div>
              </div>

              {apt.notes && (
                <p className="scheduler-notes">
                  <strong>Litigant Notes:</strong> {apt.notes}
                </p>
              )}

              <div className="scheduler-actions-row">
                {apt.status === 'Pending' && (
                  <>
                    <button 
                      className="action-confirm-btn"
                      onClick={() => handleUpdateStatus(apt.id, 'Confirmed')}
                    >
                      <FiCheck /> Confirm Slot
                    </button>
                    <button 
                      className="action-reject-btn"
                      onClick={() => handleUpdateStatus(apt.id, 'Rejected')}
                    >
                      <FiX /> Decline
                    </button>
                  </>
                )}

                {apt.status === 'Confirmed' && (
                  <>
                    <a 
                      href={apt.meeting_link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="action-video-btn"
                    >
                      <FiVideo /> Enter Video Room
                    </a>
                    <button 
                      className="action-complete-btn"
                      onClick={() => handleUpdateStatus(apt.id, 'Completed')}
                    >
                      <FiCheckCircle /> Mark Completed
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
