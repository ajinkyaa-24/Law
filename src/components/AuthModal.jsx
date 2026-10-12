import React, { useState } from 'react';
import { FiUser, FiLock, FiMail, FiBriefcase, FiArrowRight, FiShield } from 'react-icons/fi';
import { api } from '../services/api.js';

export default function AuthModal({ onAuthSuccess, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('lawyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isRegister) {
        const res = await api.register({ email, password, full_name: fullName, role });
        onAuthSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole) => {
    setIsLoading(true);
    setError('');
    try {
      const creds = demoRole === 'lawyer'
        ? { email: 'advocate.sharma@nyayachambers.in', pass: 'lawyer123' }
        : { email: 'client.ramesh@gmail.com', pass: 'client123' };
      const res = await api.login(creds.email, creds.pass);
      onAuthSuccess(res.user);
    } catch (err) {
      setError('Demo login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel — Branding */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-scales-icon">
            <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
              <rect x="47" y="22" width="6" height="56" rx="2" fill="url(#ag)" />
              <rect x="34" y="76" width="32" height="5" rx="2" fill="url(#ag)" />
              <rect x="18" y="20" width="64" height="4" rx="2" fill="url(#ag)" />
              <circle cx="50" cy="22" r="5" fill="#f3e5ab" stroke="#c5a059" strokeWidth="2" />
              <line x1="24" y1="24" x2="14" y2="46" stroke="#c5a059" strokeWidth="1.5" />
              <line x1="24" y1="24" x2="34" y2="46" stroke="#c5a059" strokeWidth="1.5" />
              <path d="M12 46 Q24 55 36 46 Z" fill="url(#ag)" />
              <line x1="76" y1="24" x2="66" y2="46" stroke="#c5a059" strokeWidth="1.5" />
              <line x1="76" y1="24" x2="86" y2="46" stroke="#c5a059" strokeWidth="1.5" />
              <path d="M64 46 Q76 55 88 46 Z" fill="url(#ag)" />
              <defs>
                <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f7e096" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#99701a" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="auth-brand-title">Nyaya Chambers</h1>
          <p className="auth-brand-tagline">Lex · Justitia · Veritas</p>
          <div className="auth-brand-divider" />
          <p className="auth-brand-desc">
            India's intelligent legal practice management platform — built for advocates, litigants, and the modern bar.
          </p>
          <div className="auth-features-list">
            <div className="auth-feature-item"><FiShield /> Role-based access for lawyers & clients</div>
            <div className="auth-feature-item"><FiBriefcase /> Case & client management</div>
            <div className="auth-feature-item"><FiUser /> AI-powered BNS legal analysis</div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-form-title">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="auth-form-subtitle">
            {isRegister ? 'Join Nyaya Chambers' : 'Sign in to your chambers'}
          </p>

          {/* Quick Demo */}
          {!isRegister && (
            <div className="auth-demo-section">
              <span className="auth-demo-label">Quick Access</span>
              <div className="auth-demo-row">
                <button
                  type="button"
                  className="auth-demo-btn lawyer-demo"
                  onClick={() => handleQuickDemo('lawyer')}
                  disabled={isLoading}
                >
                  <FiBriefcase />
                  <span>
                    <strong>Advocate</strong>
                    <small>Adv. Rajesh Sharma</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="auth-demo-btn client-demo"
                  onClick={() => handleQuickDemo('client')}
                  disabled={isLoading}
                >
                  <FiUser />
                  <span>
                    <strong>Litigant</strong>
                    <small>Ramesh Kumar</small>
                  </span>
                </button>
              </div>
              <div className="auth-or-divider"><span>or sign in manually</span></div>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form-fields">
            {isRegister && (
              <div className="auth-field">
                <label>Full Name</label>
                <div className="auth-input-wrap">
                  <FiUser className="auth-field-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Adv. Your Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div className="auth-field">
                <label>Role</label>
                <div className="auth-role-toggle">
                  <button
                    type="button"
                    className={`auth-role-btn ${role === 'lawyer' ? 'active' : ''}`}
                    onClick={() => setRole('lawyer')}
                  >
                    <FiBriefcase /> Advocate
                  </button>
                  <button
                    type="button"
                    className={`auth-role-btn ${role === 'client' ? 'active' : ''}`}
                    onClick={() => setRole('client')}
                  >
                    <FiUser /> Litigant
                  </button>
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrap">
                <FiMail className="auth-field-icon" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-field-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? 'Please wait…' : (isRegister ? 'Create Account' : 'Sign In')}
              <FiArrowRight />
            </button>
          </form>

          <div className="auth-switch-row">
            {isRegister ? (
              <p>Already have an account? <span onClick={() => setIsRegister(false)}>Sign In</span></p>
            ) : (
              <p>New to Nyaya Chambers? <span onClick={() => setIsRegister(true)}>Create Account</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
