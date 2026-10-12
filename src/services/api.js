const API_BASE = 'http://localhost:8000';

function getAuthHeaders(isMultipart = false) {
  const token = localStorage.getItem('nyaya_token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('nyaya_token', data.access_token);
    localStorage.setItem('nyaya_user', JSON.stringify(data.user));
    return data;
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    localStorage.setItem('nyaya_token', data.access_token);
    localStorage.setItem('nyaya_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('nyaya_token');
    localStorage.removeItem('nyaya_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('nyaya_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Directory of Lawyers
  async getLawyers(domain = 'All', search = '') {
    const params = new URLSearchParams();
    if (domain && domain !== 'All') params.append('domain', domain);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/api/lawyers?${params.toString()}`);
    return res.json();
  },

  // Cases
  async getCases() {
    const res = await fetch(`${API_BASE}/api/cases`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createCase(caseData) {
    const res = await fetch(`${API_BASE}/api/cases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(caseData)
    });
    return res.json();
  },

  // Appointments
  async getAppointments() {
    const res = await fetch(`${API_BASE}/api/appointments`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    return res.json();
  },

  async bookAppointment(aptData) {
    const res = await fetch(`${API_BASE}/api/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(aptData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Booking failed');
    return data;
  },

  async updateAppointmentStatus(aptId, status) {
    const res = await fetch(`${API_BASE}/api/appointments/${aptId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Documents & S3
  async getDocuments(caseId) {
    const url = caseId ? `${API_BASE}/api/documents?case_id=${caseId}` : `${API_BASE}/api/documents`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getS3PresignedUrl(fileName, fileType) {
    const res = await fetch(`${API_BASE}/api/documents/presigned-url`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ file_name: fileName, file_type: fileType })
    });
    return res.json();
  },

  async uploadDocument(formData) {
    const res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData
    });
    return res.json();
  },

  async getDocumentContent(fileName) {
    try {
      const res = await fetch(`${API_BASE}/api/documents/content/${encodeURIComponent(fileName)}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  // AI Document Reader
  async analyzeDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/ai/doc-reader/analyze`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async chatWithDocument(documentText, query) {
    const res = await fetch(`${API_BASE}/api/ai/doc-reader/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_text: documentText, query })
    });
    return res.json();
  }
};
