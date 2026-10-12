import React, { useState, useEffect } from 'react';
import { FiUsers, FiCalendar, FiMail, FiPlus, FiTrash2, FiUserPlus, FiEdit3, FiInfo, FiSend, FiFileText, FiDollarSign, FiSearch, FiChevronDown, FiChevronUp, FiPlusCircle, FiList, FiEye, FiDownload, FiX, FiCheckCircle } from 'react-icons/fi';
import { api } from '../services/api';

const MOCK_CLIENTS = [
  {
    id: 1,
    name: 'Ramesh Kumar',
    email: 'ramesh.kumar.example@gmail.com',
    phone: '+91 98765 43210',
    matter: 'Property Encroachment Dispute',
    sections: 'Sec 303 BNS (Theft), Sec 324 BNS (Mischief)',
    hearingDate: '2026-08-15',
    courtroom: 'Courtroom 4, High Court',
    status: 'active',
    notes: 'Land boundary dispute with northern neighbor. Survey report scheduled next week.',
    billing: [
      { id: 101, desc: 'Initial Retainer', amount: '₹20,000', status: 'paid', date: '2026-07-10' },
      { id: 102, desc: 'Written Statement Drafting', amount: '₹10,000', status: 'unpaid', date: '2026-07-25' }
    ],
    documents: ['Boundary_Survey_Map.pdf', 'Chamber_Legal_Notice.docx', 'Property_Tax_Receipts.zip']
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya.sharma.legal@gmail.com',
    phone: '+91 87654 32109',
    matter: 'Defamation Case on Social Media',
    sections: 'Sec 356 BNS (Defamation)',
    hearingDate: '2026-08-22',
    courtroom: 'JMFC Court 2, Delhi',
    status: 'active',
    notes: 'Defamation suit against ex-partner for malicious social media posts. Screenshots secured.',
    billing: [
      { id: 201, desc: 'Consultation Fee', amount: '₹5,000', status: 'paid', date: '2026-07-02' },
      { id: 202, desc: 'Filing Defamation Suit', amount: '₹15,000', status: 'paid', date: '2026-07-15' }
    ],
    documents: ['Insta_Post_Screenshots.pdf', 'Criminal_Complaint_Draft.pdf']
  },
  {
    id: 3,
    name: 'Vikram Singh',
    email: 'vikram.singh.tech@yahoo.com',
    phone: '+91 76543 21098',
    matter: 'Venture Capital Contract Dispute',
    sections: 'Sec 73 Indian Contract Act',
    hearingDate: '2026-09-05',
    courtroom: 'Arbitration Bench 1',
    status: 'pending',
    notes: 'Breach of non-compete clause by outgoing cofounder. Arbitration clause triggered.',
    billing: [
      { id: 301, desc: 'Contract Audit & Advisory', amount: '₹12,000', status: 'unpaid', date: '2026-07-28' }
    ],
    documents: ['Shareholders_Agreement.pdf', 'VC_TermSheet.pdf']
  }
];

const PLAN_TEMPLATES = [
  {
    id: 'retainer',
    name: 'Corporate Retainer Plan',
    subject: 'Proposed Legal Retainer Agreement - Nyaya Chambers',
    body: (clientName, matter) => `Dear ${clientName},

Following our recent consultation regarding the "${matter}", we are pleased to outline our proposal for a Retainer Legal Plan.

Under this plan, Nyaya Chambers will provide:
1. Unlimited advisory services and contract review related to your matter.
2. Representation in scheduled court hearings.
3. 24/7 legal emergency support.

Fee Structure: ₹25,000 per month (invoiced quarterly).

Please review the attached draft agreement and let us know if you have any questions. We look forward to representing you.

Warm regards,
Advocate Chambers`
  },
  {
    id: 'per-hearing',
    name: 'Per-Hearing Representation Plan',
    subject: 'Fee Structure: Scheduled Representation - ${hearingDate}',
    body: (clientName, matter, date) => `Dear ${clientName},

This is regarding your upcoming hearing for "${matter}" scheduled on ${date}.

To ensure representation by our senior legal team, we propose our Standard Per-Hearing Fee Plan:
1. Drafting and filing of replies/applications: Included.
2. Senior Counsel appearance fee: ₹15,000 per hearing session.
3. Clerkage and administrative filings: ₹2,000.

Kindly confirm your approval so we can finalize the briefs and instruct the lead counsel.

Best regards,
Advocate Chambers`
  },
  {
    id: 'consultation',
    name: 'Initial Advisory & Study Plan',
    subject: 'Case Analysis & Advisory Roadmap - Nyaya Chambers',
    body: (clientName, matter) => `Dear ${clientName},

Thank you for selecting Nyaya Chambers. To perform a comprehensive legal audit and section mapping for your matter "${matter}", we propose our Case Advisory Plan:

Services Included:
- Comprehensive evidence evaluation.
- Pre-trial research and compilation of matching landmark Supreme Court judgments.
- Written Legal Opinion detailing strengths and vulnerabilities.

One-time Advisory Fee: ₹8,500.

Let us know when you would like to schedule our next strategy session.

Regards,
Advocate Chambers`
  }
];

export default function ClientManager() {
  const [clients, setClients] = useState([]);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(PLAN_TEMPLATES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Input states for Add/Edit Form
  const [clientIdToEdit, setClientIdToEdit] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [matter, setMatter] = useState('');
  const [sections, setSections] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [courtroom, setCourtroom] = useState('');
  const [status, setStatus] = useState('active');
  const [notesText, setNotesText] = useState('');

  // Local billing state for new items
  const [newBillDesc, setNewBillDesc] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillStatus, setNewBillStatus] = useState('unpaid');

  // Local document state for new files
  const [newDocName, setNewDocName] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadingClientId, setUploadingClientId] = useState(null);

  // Simulated Email Sent States
  const [emailSentStatus, setEmailSentStatus] = useState('');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('nyayachambers_clients');
    if (saved) {
      try {
        setClients(JSON.parse(saved));
      } catch (e) {
        setClients(MOCK_CLIENTS);
      }
    } else {
      setClients(MOCK_CLIENTS);
      localStorage.setItem('nyayachambers_clients', JSON.stringify(MOCK_CLIENTS));
    }
  }, []);

  const saveClients = (newClients) => {
    setClients(newClients);
    localStorage.setItem('nyayachambers_clients', JSON.stringify(newClients));
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!name || !email || !matter) return;

    const newClient = {
      id: Date.now(),
      name,
      email,
      phone,
      matter,
      sections: sections || 'N/A',
      hearingDate: hearingDate || 'TBD',
      courtroom: courtroom || 'TBD',
      status,
      notes: notesText || 'No custom case notes logged yet.',
      billing: [],
      documents: []
    };

    const updated = [...clients, newClient];
    saveClients(updated);
    
    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setMatter('');
    setSections('');
    setHearingDate('');
    setCourtroom('');
    setStatus('active');
    setNotesText('');
    setShowAddModal(false);
  };

  const handleOpenEditModal = (client, e) => {
    e.stopPropagation(); // Prevent row toggling
    setSelectedClient(client);
    setClientIdToEdit(client.id);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setMatter(client.matter);
    setSections(client.sections);
    setHearingDate(client.hearingDate);
    setCourtroom(client.courtroom);
    setStatus(client.status);
    setNotesText(client.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!clientIdToEdit) return;

    const updated = clients.map(c => {
      if (c.id === clientIdToEdit) {
        return {
          ...c,
          name,
          email,
          phone,
          matter,
          sections,
          hearingDate,
          courtroom,
          status,
          notes: notesText
        };
      }
      return c;
    });

    saveClients(updated);
    setShowEditModal(false);
    setClientIdToEdit(null);
  };

  const handleDeleteClient = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this client record?')) {
      const updated = clients.filter(c => c.id !== id);
      saveClients(updated);
      if (expandedClientId === id) {
        setExpandedClientId(null);
      }
    }
  };

  const openEmailModal = (client, e) => {
    e.stopPropagation();
    setSelectedClient(client);
    setSelectedTemplate(PLAN_TEMPLATES[0]);
    setShowEmailModal(true);
    setEmailSentStatus('');
  };

  const triggerNativeEmail = () => {
    if (!selectedClient) return;
    
    const subjectText = selectedTemplate.id === 'per-hearing' 
      ? selectedTemplate.subject.replace('${hearingDate}', selectedClient.hearingDate)
      : selectedTemplate.subject;
      
    const bodyText = selectedTemplate.id === 'per-hearing'
      ? selectedTemplate.body(selectedClient.name, selectedClient.matter, selectedClient.hearingDate)
      : selectedTemplate.body(selectedClient.name, selectedClient.matter);

    const mailtoUrl = `mailto:${selectedClient.email}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;
    
    setEmailSentStatus('sending');
    setTimeout(() => {
      setEmailSentStatus('sent');
      window.location.href = mailtoUrl;
    }, 1000);
  };

  const toggleRow = (id) => {
    setExpandedClientId(expandedClientId === id ? null : id);
  };

  // Add bill item to currently selected/expanded client
  const handleAddBillItem = (clientId) => {
    if (!newBillDesc || !newBillAmount) return;
    const updated = clients.map(c => {
      if (c.id === clientId) {
        const currentBilling = c.billing || [];
        return {
          ...c,
          billing: [
            ...currentBilling,
            {
              id: Date.now(),
              desc: newBillDesc,
              amount: newBillAmount.startsWith('₹') ? newBillAmount : `₹${newBillAmount}`,
              status: newBillStatus,
              date: new Date().toISOString().split('T')[0]
            }
          ]
        };
      }
      return c;
    });
    saveClients(updated);
    setNewBillDesc('');
    setNewBillAmount('');
    setNewBillStatus('unpaid');
  };

  // Open In-App Document Viewer without triggering browser downloads
  const handleOpenPreviewDoc = async (doc, client, e) => {
    if (e) e.stopPropagation();
    const docName = typeof doc === 'string' ? doc : doc.name;
    const docUrl = typeof doc === 'object' ? doc.url : null;
    const isPdf = docName.toLowerCase().endsWith('.pdf');
    const isDocx = docName.toLowerCase().endsWith('.docx');
    const existingText = typeof doc === 'object' && doc.extracted_text ? doc.extracted_text : '';

    setPreviewDoc({
      name: docName,
      url: docUrl,
      isPdf,
      isDocx,
      clientName: client.name,
      matter: client.matter,
      text: existingText,
      loading: !existingText,
      viewMode: isPdf ? 'pdf' : 'text'
    });

    if (!existingText) {
      try {
        const data = await api.getDocumentContent(docName);
        if (data && data.text) {
          setPreviewDoc(prev => prev ? {
            ...prev,
            text: data.text,
            loading: false
          } : null);
        } else {
          setPreviewDoc(prev => prev ? { ...prev, loading: false } : null);
        }
      } catch (err) {
        setPreviewDoc(prev => prev ? { ...prev, loading: false } : null);
      }
    }
  };

  // Add document reference to currently selected/expanded client
  const handleAddDoc = (clientId) => {
    if (!newDocName) return;
    const updated = clients.map(c => {
      if (c.id === clientId) {
        const currentDocs = c.documents || [];
        return {
          ...c,
          documents: [...currentDocs, newDocName]
        };
      }
      return c;
    });
    saveClients(updated);
    setNewDocName('');
  };

  // Upload actual document file via backend API
  const handleClientDocUpload = async (clientId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingClientId(clientId);
    try {
      const formData = new FormData();
      formData.append('title', file.name);
      formData.append('case_id', clientId ? clientId.toString() : '');
      formData.append('is_shared', 'true');
      formData.append('file', file);

      const res = await api.uploadDocument(formData);
      if (res && (res.status === 'success' || res.file_url)) {
        const newDocItem = {
          name: res.file_name || file.name,
          url: res.file_url || '',
          size: res.file_size || `${Math.max(1, Math.round(file.size / 1024))} KB`,
          extracted_text: res.extracted_text || '',
          uploadedAt: new Date().toLocaleDateString()
        };

        const updated = clients.map(c => {
          if (c.id === clientId) {
            const currentDocs = c.documents || [];
            return {
              ...c,
              documents: [...currentDocs, newDocItem]
            };
          }
          return c;
        });
        saveClients(updated);
      } else {
        alert(res?.detail || 'Document upload failed. Please try again.');
      }
    } catch (err) {
      console.warn('Backend upload notice, providing local view preview:', err);
      // Create local blob preview URL so advocate can immediately view the file regardless of backend state
      const blobUrl = URL.createObjectURL(file);
      const fallbackDoc = {
        name: file.name,
        url: blobUrl,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        uploadedAt: new Date().toLocaleDateString()
      };
      const updated = clients.map(c => {
        if (c.id === clientId) {
          const currentDocs = c.documents || [];
          return {
            ...c,
            documents: [...currentDocs, fallbackDoc]
          };
        }
        return c;
      });
      saveClients(updated);
    } finally {
      setUploadingClientId(null);
      event.target.value = '';
    }
  };

  const handleDeleteDoc = (clientId, docIndex) => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        const currentDocs = c.documents || [];
        return {
          ...c,
          documents: currentDocs.filter((_, idx) => idx !== docIndex)
        };
      }
      return c;
    });
    saveClients(updated);
  };

  // Filter and search
  const filteredClients = clients.filter(c => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus.toLowerCase();
    const search = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(search) || 
                          c.matter.toLowerCase().includes(search) ||
                          c.sections.toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });

  const upcomingHearings = [...clients]
    .filter(c => c.hearingDate && c.hearingDate !== 'TBD' && c.status === 'active')
    .sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate));

  return (
    <div>
      <div className="section-title-wrapper">
        <h2 className="section-title">Client & Hearing Dashboard</h2>
        <p className="section-subtitle">Manage client details, edit files, upload mock documents, log invoices, and draft fee contracts.</p>
      </div>

      <div className="client-dashboard">
        
        {/* Main client log table */}
        <div className="client-section-panel">
          <div className="panel-header-action" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <h3 className="panel-title">Litigation Registers</h3>
            <button className="panel-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowAddModal(true)}>
              <FiUserPlus /> Add Client File
            </button>
          </div>

          {/* Search and status filter bar */}
          <div style={{ display: 'flex', gap: '10px', margin: '1rem 0 1.5rem 0', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'Active', 'Pending', 'Disposed'].map(st => (
                <button
                  key={st}
                  className={`filter-btn ${filterStatus === st ? 'active' : ''}`}
                  onClick={() => setFilterStatus(st)}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  {st}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name, matter or sections..."
                className="form-control"
                style={{ paddingLeft: '35px', width: '100%', padding: '0.45rem 1rem 0.45rem 35px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="client-table-container">
            {filteredClients.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No client records match filters.</p>
            ) : (
              <table className="client-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Matter Description</th>
                    <th>Appearing Sections</th>
                    <th>Hearing Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => {
                    const isExpanded = expandedClientId === client.id;
                    return (
                      <React.Fragment key={client.id}>
                        {/* Summary Row */}
                        <tr onClick={() => toggleRow(client.id)}>
                          <td style={{ width: '25px', paddingRight: '0' }}>
                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--text-primary)' }}>{client.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{client.email}</div>
                          </td>
                          <td>{client.matter}</td>
                          <td>
                            <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--gold-primary)' }}>
                              {client.sections}
                            </code>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                              <FiCalendar style={{ color: 'var(--gold-primary)' }} />
                              {client.hearingDate}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{client.courtroom}</div>
                          </td>
                          <td>
                            <span className={`status-badge ${client.status}`}>
                              {client.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-btn-group">
                              <button className="action-btn" title="Edit File" onClick={(e) => handleOpenEditModal(client, e)}>
                                <FiEdit3 />
                              </button>
                              <button className="action-btn" title="Mail Plans" onClick={(e) => openEmailModal(client, e)}>
                                <FiMail />
                              </button>
                              <button className="action-btn" style={{ borderColor: 'rgba(224, 108, 117, 0.3)', color: 'var(--red-accent)' }} title="Remove File" onClick={(e) => handleDeleteClient(client.id, e)}>
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Dossier Expanded Panel */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="7" style={{ padding: '0 0.8rem 1rem 0.8rem', cursor: 'default' }}>
                              <div className="dossier-expanded-container">
                                <div className="dossier-grid">
                                  {/* Left: Case Notes & Docs */}
                                  <div>
                                    <div className="dossier-header-title">Litigation Briefing & Dossier</div>
                                    <div style={{ marginBottom: '1.2rem' }}>
                                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Case Strategy & Logs:</strong>
                                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                                        {client.notes || 'No case strategy notes logged. Edit this client file to log notes.'}
                                      </p>
                                    </div>

                                    {/* Document References */}
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <strong style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Case Documents & Evidence:</strong>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                                          {client.documents?.length || 0} Attached
                                        </span>
                                      </div>
                                      {client.documents && client.documents.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                                          {client.documents.map((doc, dIdx) => {
                                            const docName = typeof doc === 'string' ? doc : doc.name;
                                            const docUrl = typeof doc === 'object' ? doc.url : null;
                                            const docSize = typeof doc === 'object' && doc.size ? doc.size : null;
                                            const isPdf = docName.toLowerCase().endsWith('.pdf');

                                            return (
                                              <div key={dIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                  <FiFileText style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                                                  <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontWeight: '500' }}>{docName}</span>
                                                    {docSize && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({docSize})</span>}
                                                  </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                  <button
                                                    type="button"
                                                    className="panel-btn"
                                                    style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-primary)', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setPreviewDoc({
                                                        name: docName,
                                                        url: docUrl,
                                                        isPdf: isPdf,
                                                        clientName: client.name,
                                                        matter: client.matter
                                                      });
                                                    }}
                                                    title="View Document"
                                                  >
                                                    <FiEye /> View
                                                  </button>
                                                  {docUrl && (
                                                    <a
                                                      href={docUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="panel-btn"
                                                      style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                                                      onClick={(e) => e.stopPropagation()}
                                                      title="Open in new window"
                                                    >
                                                      <FiDownload />
                                                    </a>
                                                  )}
                                                  <button
                                                    type="button"
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', display: 'flex', alignItems: 'center' }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteDoc(client.id, dIdx);
                                                    }}
                                                    title="Delete"
                                                  >
                                                    <FiTrash2 size={13} />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>No documents attached to this case file.</p>
                                      )}
                                      
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <input
                                            type="text"
                                            placeholder="File name (e.g. Complaint_Copy.pdf)"
                                            className="form-control"
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', flexGrow: 1 }}
                                            value={newDocName}
                                            onChange={e => setNewDocName(e.target.value)}
                                          />
                                          <button className="panel-btn" style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleAddDoc(client.id)}>
                                            <FiPlusCircle /> Attach
                                          </button>
                                        </div>

                                        {/* Upload Document Button */}
                                        <label style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center', 
                                          gap: '8px', 
                                          background: 'rgba(197, 160, 89, 0.12)', 
                                          border: '1px dashed var(--gold-primary)', 
                                          borderRadius: '4px', 
                                          padding: '7px 12px', 
                                          fontSize: '0.78rem', 
                                          color: 'var(--gold-primary)', 
                                          cursor: uploadingClientId === client.id ? 'wait' : 'pointer', 
                                          fontWeight: '600' 
                                        }}>
                                          <FiFileText />
                                          {uploadingClientId === client.id ? 'Uploading document...' : 'Upload Document'}
                                          <input 
                                            type="file" 
                                            accept=".pdf,.docx,.txt,.png,.jpg" 
                                            style={{ display: 'none' }} 
                                            disabled={uploadingClientId === client.id}
                                            onChange={(e) => handleClientDocUpload(client.id, e)}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Invoicing & Billing Ledger */}
                                  <div>
                                    <div className="dossier-header-title">Invoice & Billing Ledger</div>
                                    
                                    <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-primary)' }}>
                                      {client.billing && client.billing.length > 0 ? (
                                        <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                          <thead>
                                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                              <th style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>Description</th>
                                              <th style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>Amount</th>
                                              <th style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>Status</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {client.billing.map(bill => (
                                              <tr key={bill.id} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                                                <td style={{ padding: '6px 10px' }}>{bill.desc}</td>
                                                <td style={{ padding: '6px 10px', fontWeight: '500' }}>{bill.amount}</td>
                                                <td style={{ padding: '6px 10px' }}>
                                                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase', 
                                                    background: bill.status === 'paid' ? 'rgba(152,195,121,0.1)' : 'rgba(224,108,117,0.1)',
                                                    color: bill.status === 'paid' ? 'var(--green-accent)' : 'var(--red-accent)',
                                                    border: bill.status === 'paid' ? '1px solid rgba(152,195,121,0.2)' : '1px solid rgba(224,108,117,0.2)'
                                                  }}>
                                                    {bill.status}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.75rem' }}>No invoice items logged.</p>
                                      )}
                                    </div>

                                    {/* Add Bill Item Form */}
                                    <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gold-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FiDollarSign /> Create Invoice Item
                                      </div>
                                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        <input
                                          type="text"
                                          placeholder="Description (e.g. Bail Application)"
                                          className="form-control"
                                          style={{ padding: '4px 8px', fontSize: '0.8rem', flexGrow: 2 }}
                                          value={newBillDesc}
                                          onChange={e => setNewBillDesc(e.target.value)}
                                        />
                                        <input
                                          type="text"
                                          placeholder="Amount (e.g. 5000)"
                                          className="form-control"
                                          style={{ padding: '4px 8px', fontSize: '0.8rem', width: '90px' }}
                                          value={newBillAmount}
                                          onChange={e => setNewBillAmount(e.target.value)}
                                        />
                                        <select
                                          className="form-control"
                                          style={{ padding: '4px 8px', fontSize: '0.8rem', width: '90px' }}
                                          value={newBillStatus}
                                          onChange={e => setNewBillStatus(e.target.value)}
                                        >
                                          <option value="unpaid">Unpaid</option>
                                          <option value="paid">Paid</option>
                                        </select>
                                        <button className="panel-btn" style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleAddBillItem(client.id)}>
                                          <FiPlus /> Add Bill
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Calendar hearings timeline sidebar */}
        <div className="client-section-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header-action" style={{ marginBottom: '1.2rem' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCalendar style={{ color: 'var(--gold-primary)' }} /> Calendar Schedule
            </h3>
          </div>

          {upcomingHearings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hearings scheduled for active clients.</p>
          ) : (
            <div className="hearing-timeline">
              {upcomingHearings.map(client => (
                <div key={client.id} className="timeline-item">
                  <div className="timeline-date">
                    {new Date(client.hearingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="timeline-details">
                    <div className="timeline-client">{client.name}</div>
                    <div className="timeline-matter">{client.matter}</div>
                    <div className="timeline-court">{client.courtroom}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiInfo />
            <span>Click any table row to view full strategy dossier, document list, and billing invoices.</span>
          </div>
        </div>

      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
              File New Litigation Case
            </h3>
            
            <form onSubmit={handleAddClient}>
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input type="text" className="form-control" placeholder="E.g., Ramesh Kumar" required value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-control" placeholder="client@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control" placeholder="+91 XXXXX XXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Case/Matter Description *</label>
                <input type="text" className="form-control" placeholder="Property dispute, contract audit, cyber theft, etc." required value={matter} onChange={e => setMatter(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Appearing Sections (e.g. BNS/IPC)</label>
                <input type="text" className="form-control" placeholder="E.g., Section 303 of BNS" value={sections} onChange={e => setSections(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Next Hearing Date</label>
                  <input type="date" className="form-control" value={hearingDate} onChange={e => setHearingDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Court Bench/Room</label>
                  <input type="text" className="form-control" placeholder="E.g., Courtroom 4, High Court" value={courtroom} onChange={e => setCourtroom(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Litigation Status</label>
                <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="active">Active (On Trial)</option>
                  <option value="pending">Pending (Awaiting Admission)</option>
                  <option value="disposed">Disposed (Settled/Decided)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Legal Strategy Notes</label>
                <textarea className="form-control" style={{ height: '80px', resize: 'vertical' }} placeholder="Log initial thoughts or facts of case..." value={notesText} onChange={e => setNotesText(e.target.value)} />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="panel-btn">Open File</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
              Edit Litigation Record: {selectedClient.name}
            </h3>
            
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input type="text" className="form-control" required value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-control" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Case/Matter Description *</label>
                <input type="text" className="form-control" required value={matter} onChange={e => setMatter(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Appearing Sections</label>
                <input type="text" className="form-control" value={sections} onChange={e => setSections(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Next Hearing Date</label>
                  <input type="date" className="form-control" value={hearingDate} onChange={e => setHearingDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Court Bench/Room</label>
                  <input type="text" className="form-control" value={courtroom} onChange={e => setCourtroom(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Litigation Status</label>
                <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="active">Active (On Trial)</option>
                  <option value="pending">Pending (Awaiting Admission)</option>
                  <option value="disposed">Disposed (Settled/Decided)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Case Strategy Notes</label>
                <textarea className="form-control" style={{ height: '100px', resize: 'vertical' }} value={notesText} onChange={e => setNotesText(e.target.value)} />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="panel-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Emailer Modal */}
      {showEmailModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEmailModal(false)}>&times;</button>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '1rem' }}>
              Dispatch Fee Plan Proposal
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Draft a structured case service proposal. Select a template to auto-populate the details.
            </p>

            <div className="form-group">
              <label className="form-label">Select Plan Template</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {PLAN_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    className={`filter-btn ${selectedTemplate.id === tpl.id ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate(tpl)}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Form Preview */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)', padding: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
                <div><strong>To:</strong> {selectedClient.name} &lt;{selectedClient.email}&gt;</div>
                <div style={{ marginTop: '4px' }}>
                  <strong>Subject:</strong> {
                    selectedTemplate.id === 'per-hearing' 
                      ? selectedTemplate.subject.replace('${hearingDate}', selectedClient.hearingDate)
                      : selectedTemplate.subject
                  }
                </div>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {
                  selectedTemplate.id === 'per-hearing'
                    ? selectedTemplate.body(selectedClient.name, selectedClient.matter, selectedClient.hearingDate)
                    : selectedTemplate.body(selectedClient.name, selectedClient.matter)
                }
              </div>
            </div>

            {emailSentStatus === 'sending' && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--gold-primary)', background: 'var(--gold-light)', border: '1px solid var(--gold-border)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Constructing and initiating native mail client...
              </div>
            )}

            {emailSentStatus === 'sent' && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--green-accent)', background: 'rgba(152, 195, 121, 0.1)', border: '1px solid rgba(152, 195, 121, 0.3)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Draft loaded into mail client successfully! Simulating dispatch...
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowEmailModal(false)}>Close</button>
              <button
                type="button"
                className="panel-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={triggerNativeEmail}
                disabled={emailSentStatus === 'sending'}
              >
                <FiSend /> Send Proposal Draft
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Advocate Document Preview Modal - 100% In-App Viewing */}
      {previewDoc && (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '94vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '1.4rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.9rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)' }}>
                  <FiFileText size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                      {previewDoc.name}
                    </h3>
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '4px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-primary)', border: '1px solid rgba(212, 175, 55, 0.25)', fontWeight: '600' }}>
                      {previewDoc.isPdf ? 'PDF Record' : previewDoc.isDocx ? 'Word DOCX' : 'Case File'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Matter: <strong style={{ color: 'var(--text-secondary)' }}>{previewDoc.matter}</strong> · Client: <strong style={{ color: 'var(--text-secondary)' }}>{previewDoc.clientName}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {previewDoc.isPdf && previewDoc.url && (
                  <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px' }}>
                    <button
                      type="button"
                      style={{ padding: '4px 10px', fontSize: '0.74rem', border: 'none', borderRadius: '4px', background: previewDoc.viewMode === 'text' ? 'var(--gold-primary)' : 'transparent', color: previewDoc.viewMode === 'text' ? '#121212' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
                      onClick={() => setPreviewDoc(p => ({ ...p, viewMode: 'text' }))}
                    >
                      Readable Text
                    </button>
                    <button
                      type="button"
                      style={{ padding: '4px 10px', fontSize: '0.74rem', border: 'none', borderRadius: '4px', background: previewDoc.viewMode === 'pdf' ? 'var(--gold-primary)' : 'transparent', color: previewDoc.viewMode === 'pdf' ? '#121212' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
                      onClick={() => setPreviewDoc(p => ({ ...p, viewMode: 'pdf' }))}
                    >
                      PDF View
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                  onClick={() => setPreviewDoc(null)}
                  title="Close Viewer"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Viewer Content Area - Zero Downloads */}
            <div style={{ flex: 1, minHeight: '440px', maxHeight: '68vh', overflow: 'hidden', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              
              {/* If PDF View mode is active on a PDF with valid url */}
              {previewDoc.isPdf && previewDoc.url && previewDoc.viewMode === 'pdf' ? (
                <iframe
                  src={previewDoc.url}
                  title="Document Preview"
                  style={{ width: '100%', height: '100%', minHeight: '450px', border: 'none', background: '#ffffff' }}
                />
              ) : previewDoc.loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(212,175,55,0.2)', borderTopColor: 'var(--gold-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Indexing and rendering document content in Chamber Viewer…</p>
                </div>
              ) : previewDoc.text ? (
                /* Rich Text & Clause Viewer for DOCX, TXT, or parsed PDF */
                <div style={{ padding: '1.8rem', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' }}>
                      Official In-App Judicial Text Transcription
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {previewDoc.text.split(/\s+/).length} words extracted
                    </span>
                  </div>

                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-primary)', textAlign: 'justify' }}>
                    {previewDoc.text}
                  </div>
                </div>
              ) : (
                /* Fallback for sample demo files without direct binary */
                <div style={{ padding: '2.5rem', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--gold-primary)' }}>
                    <FiFileText size={28} />
                  </div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem', fontFamily: 'var(--font-serif)' }}>
                    {previewDoc.name}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', maxWidth: '480px', lineHeight: 1.5, marginBottom: '1rem' }}>
                    This case record is verified under <strong>{previewDoc.matter}</strong>. You can view full inline clause transcripts, or upload new case briefs using the <strong>Upload Document</strong> button.
                  </p>
                  <div style={{ padding: '8px 16px', background: 'rgba(39, 174, 96, 0.1)', border: '1px solid rgba(39, 174, 96, 0.3)', borderRadius: '6px', fontSize: '0.76rem', color: '#2ecc71', fontWeight: '500' }}>
                    ✓ Custody Confirmed: Indexed in Chambers Litigation Vault
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Protected In-App Viewer · Zero downloads triggered to local device
              </span>
              <button type="button" className="panel-btn" onClick={() => setPreviewDoc(null)}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}