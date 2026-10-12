import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import LawNews from './components/LawNews';
import AIChatbot from './components/AIChatbot';
import CaseStudies from './components/CaseStudies';
import ClientManager from './components/ClientManager';
import ClientDashboard from './components/ClientDashboard';
import AIDocumentReader from './components/AIDocumentReader';
import AppointmentScheduler from './components/AppointmentScheduler';
import AuthModal from './components/AuthModal';

import { 
  FiFileText, FiCpu, FiBookOpen, FiUsers, FiSun, FiMoon, 
  FiCalendar, FiUser, FiLogOut, FiShield, FiDownloadCloud 
} from 'react-icons/fi';
import { api } from './services/api.js';

const CHAMBER_QUOTES = [
  "« Fiat Justitia Ruat Caelum » — Let justice be done though the heavens fall (Lord Mansfield)",
  "« Satyameva Jayate » — Truth alone triumphs (Motto of the Supreme Court of India)",
  "« Audi Alteram Partem » — Listen to the other side; no person shall be condemned unheard",
  "« Ubi Jus Ibi Remedium » — Where there is a legal right, there is a judicial remedy",
  "« Ignorantia Juris Non Excusat » — Ignorance of the law excuses no one",
  "« Justice delayed is justice denied » — Fundamental Magna Carta constitutional canon",
  "« However good a Constitution may be, if those implementing it are not good, it will prove bad » — Dr. B.R. Ambedkar",
  "« The law is not a cold science, but a living organ of society serving human needs » — Justice V.R. Krishna Iyer"
];

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard'); 
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  // Load existing session — always show login if no session
  useEffect(() => {
    const existing = api.getCurrentUser();
    if (existing) {
      setCurrentUser(existing);
      if (existing.role === 'client') {
        setCurrentTab('client-portal');
      } else {
        setCurrentTab('clients');
      }
    } else {
      // No session → show login
      setShowAuthModal(true);
    }
  }, []);

  // Apply theme to document body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    if (!showSplash) {
      const interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % CHAMBER_QUOTES.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [showSplash]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    if (user.role === 'client') {
      setCurrentTab('client-portal');
    } else {
      setCurrentTab('clients');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} />;
  }

  const renderTabContent = () => {
    if (currentUser?.role === 'client') {
      switch (currentTab) {
        case 'client-portal':
          return <ClientDashboard currentUser={currentUser} />;
        case 'chatbot':
          return <AIChatbot />;
        case 'news':
          return <LawNews />;
        case 'cases':
          return <CaseStudies />;
        default:
          return <ClientDashboard currentUser={currentUser} />;
      }
    }

    // Lawyer role
    switch (currentTab) {
      case 'clients':
        return <ClientManager />;
      case 'scheduler':
        return <AppointmentScheduler />;
      case 'doc-reader':
        return <AIDocumentReader />;
      case 'chatbot':
        return <AIChatbot />;
      case 'news':
        return <LawNews />;
      case 'cases':
        return <CaseStudies />;
      default:
        return <ClientManager />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-emblem-wrap">
            <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Pillar & Base */}
              <rect x="47" y="24" width="6" height="54" rx="2" fill="url(#goldGradient)" />
              <rect x="36" y="76" width="28" height="6" rx="2" fill="url(#goldGradient)" />
              <rect x="30" y="82" width="40" height="4" rx="2" fill="#c5a059" opacity="0.6" />
              {/* Crossbeam */}
              <rect x="18" y="22" width="64" height="4" rx="2" fill="url(#goldGradient)" />
              <circle cx="50" cy="24" r="5" fill="#f3e5ab" stroke="#c5a059" strokeWidth="2" />
              {/* Left Scale Pan */}
              <line x1="24" y1="26" x2="16" y2="44" stroke="#c5a059" strokeWidth="1.5" />
              <line x1="24" y1="26" x2="32" y2="44" stroke="#c5a059" strokeWidth="1.5" />
              <path d="M14 44 Q24 52 34 44 Z" fill="url(#goldGradient)" />
              {/* Right Scale Pan */}
              <line x1="76" y1="26" x2="68" y2="44" stroke="#c5a059" strokeWidth="1.5" />
              <line x1="76" y1="26" x2="84" y2="44" stroke="#c5a059" strokeWidth="1.5" />
              <path d="M66 44 Q76 52 86 44 Z" fill="url(#goldGradient)" />
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f7e096" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#99701a" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="sidebar-title-block">
            <h1 className="sidebar-title">Nyaya Chambers</h1>
            <span className="sidebar-subtitle">Lex • Justitia • Veritas</span>
          </div>
        </div>

        {/* User Role Card */}
        <div className="sidebar-role-badge">
          <div className="role-icon">
            {currentUser?.role === 'lawyer' ? <FiShield /> : <FiUser />}
          </div>
          <div className="role-text-box">
            <span className="role-name">{currentUser?.full_name || 'Guest User'}</span>
            <span className="role-tag">
              {currentUser?.role === 'lawyer' ? 'Advocate' : 'Litigant'}
            </span>
          </div>
        </div>

        <ul className="sidebar-menu">
          {currentUser?.role === 'client' ? (
            /* CLIENT DASHBOARD MENU */
            <>
              <li 
                className={`sidebar-item ${currentTab === 'client-portal' ? 'active' : ''}`}
                onClick={() => setCurrentTab('client-portal')}
              >
                <FiUsers />
                <span>Client Dashboard</span>
              </li>
              <li 
                className={`sidebar-item ${currentTab === 'chatbot' ? 'active' : ''}`}
                onClick={() => setCurrentTab('chatbot')}
              >
                <FiCpu />
                <span>AI Legal Counsel (BNS)</span>
              </li>
              <li 
                className={`sidebar-item ${currentTab === 'news' ? 'active' : ''}`}
                onClick={() => setCurrentTab('news')}
              >
                <FiFileText />
                <span>Legal Gazette Wire</span>
              </li>
              <li 
                className={`sidebar-item ${currentTab === 'cases' ? 'active' : ''}`}
                onClick={() => setCurrentTab('cases')}
              >
                <FiBookOpen />
                <span>Landmark Precedents</span>
              </li>
            </>
          ) : (
            /* LAWYER DASHBOARD MENU */
            <>
              <li 
                className={`sidebar-item ${currentTab === 'clients' ? 'active' : ''}`}
                onClick={() => setCurrentTab('clients')}
              >
                <FiUsers />
                <span>Case & Client Mgmt</span>
              </li>
              <li 
                className={`sidebar-item ${currentTab === 'scheduler' ? 'active' : ''}`}
                onClick={() => setCurrentTab('scheduler')}
              >
                <FiCalendar />
                <span>Appointment Scheduler</span>
              </li>
              <li 
                className={`sidebar-item ${currentTab === 'doc-reader' ? 'active' : ''}`}
                onClick={() => setCurrentTab('doc-reader')}
              >
                <FiDownloadCloud />
                <span>AI Document Reader</span>
              </li>
              <li 
                className={`sidebar-item ${currentTab === 'chatbot' ? 'active' : ''}`}
                onClick={() => setCurrentTab('chatbot')}
              >
                <FiCpu />
                <span>Penal Code AI Counsel</span>
              </li>
              <li 
                className={`sidebar-item ${currentTab === 'news' ? 'active' : ''}`}
                onClick={() => setCurrentTab('news')}
              >
                <FiFileText />
                <span>Gazette & News</span>
              </li>
              <li 
                className={`sidebar-item ${currentTab === 'cases' ? 'active' : ''}`}
                onClick={() => setCurrentTab('cases')}
              >
                <FiBookOpen />
                <span>Case Briefs</span>
              </li>
            </>
          )}
        </ul>

        <div className="sidebar-footer">
          <div>Nyaya Chambers · v2.5</div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-workspace">
        <header className="workspace-header">
          <div className="quote-ticker">
            {CHAMBER_QUOTES[quoteIndex]}
          </div>
          <div className="workspace-user-info">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'dark' ? <><FiSun /> Light</> : <><FiMoon /> Dark</>}
            </button>
            <button 
              className="header-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
            >
              <FiLogOut /> Sign Out
            </button>
          </div>
        </header>

        <section className="workspace-content">
          {renderTabContent()}
        </section>
      </main>

      {/* Auth Modal Guard */}
      {showAuthModal && (
        <AuthModal 
          onAuthSuccess={handleAuthSuccess} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </div>
  );
}
