import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Chat } from './Chat';
import { PatientProfileTab } from './PatientProfileTab';
import { DoctorSearchTab } from './DoctorSearchTab';
import { AIChatbot } from './AIChatbot';
import TeleconsultationTab from './TeleconsultationTab';
import PaymentTab from './PaymentTab';
import { 
  LayoutDashboard, 
  Search, 
  Video, 
  CreditCard, 
  Bell, 
  MessageSquare, 
  Settings,
  LogOut,
  User,
  Calendar,
  FileText,
  Stethoscope
} from 'lucide-react';
import './Dashboard.css';

interface Appointment {
  id: number;
  patientNom: string;
  medecinNom: string;
  specialite: string;
  dateHeureDebut: string;
  dateHeureFin: string;
  motif: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'ANNULE';
}

interface Doctor {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  avatarUrl: string | null;
  lieuConsultation: string;
  specialite: { id: number; nom: string } | null;
}

interface Specialty {
  id: number;
  nom: string;
  description: string | null;
}

interface DBNotification {
  id: number;
  titre: string;
  message: string;
  lu: boolean;
  dateCreation: string;
}

interface MedicalDocument {
  id: number;
  nom: string;
  type: string;
  url: string;
  dateUpload: string;
}

type TabType = 'dashboard' | 'search' | 'teleconsultation' | 'payment' | 'notifications' | 'chat' | 'settings';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Shared Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);

  // Patient specific
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  // Profile Uploads
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [docSuccess, setDocSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Appliquer le thème au chargement et lors du changement
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en' || 'fr';
    setTheme(savedTheme);
    setLanguage(savedLanguage);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLanguageChange = (newLang: 'fr' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Redirection vers le dashboard approprié selon le rôle
    if (user.role === 'MEDECIN') {
      navigate('/doctor-dashboard');
      return;
    }
    if (user.role === 'ADMINISTRATEUR') {
      navigate('/admin-dashboard');
      return;
    }
    fetchData();
  }, [user, activeTab, selectedSpecialty]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.lu).length);
  }, [notifications]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${user.token}` };

      if (activeTab === 'dashboard') {
        const resApps = await fetch(`${API_BASE_URL}/appointments/me`, { headers });
        if (resApps.ok) setAppointments(await resApps.json());

        if (user.role === 'PATIENT') {
          const resDocs = await fetch(`${API_BASE_URL}/profile/documents`, { headers });
          if (resDocs.ok) setDocuments(await resDocs.json());
        }

        // Preload notifications count
        const resNotifs = await fetch(`${API_BASE_URL}/profile/notifications`, { headers });
        if (resNotifs.ok) {
          const notifData = await resNotifs.json();
          setNotifications(notifData);
        }
      }

      if (activeTab === 'notifications') {
        const resNotifs = await fetch(`${API_BASE_URL}/profile/notifications`, { headers });
        if (resNotifs.ok) setNotifications(await resNotifs.json());
      }
    } catch (e) {
      console.error('Error fetching dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId: number) => {
    if (!user) return;
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await fetch(`${API_BASE_URL}/profile/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers,
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => (n.id === notifId ? { ...n, lu: true } : n)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAppointmentStatus = async (id: number, statut: string) => {
    if (!user) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      };
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ statut }),
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !avatarFile) return;
    setAvatarSuccess('');

    const formData = new FormData();
    formData.append('file', avatarFile);

    try {
      const res = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });
      if (res.ok) {
        setAvatarSuccess('Avatar mis à jour avec succès.');
        setAvatarFile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !docFile || !docName) return;
    setDocSuccess('');

    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('nom', docName);

    try {
      const res = await fetch(`${API_BASE_URL}/profile/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });
      if (res.ok) {
        setDocSuccess('Document médical ajouté avec succès.');
        setDocFile(null);
        setDocName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Derived stats
  const upcomingCount = appointments.filter(a => a.statut === 'VALIDE' || a.statut === 'EN_ATTENTE').length;
  const pendingCount = appointments.filter(a => a.statut === 'EN_ATTENTE').length;
  const completedCount = appointments.filter(a => a.statut === 'VALIDE').length;

  const tabLabel: Record<TabType, string> = {
    dashboard: 'Tableau de bord',
    search: 'Rechercher un médecin',
    teleconsultation: 'Téléconsultations',
    payment: 'Paiements',
    notifications: 'Notifications',
    chat: 'Messagerie',
    settings: 'Paramètres',
  };

  if (!user) return null;

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <Stethoscope className="brand-icon" size={28} />
          <span className="name">MedAppoint</span>
        </div>

        <nav className="menu">
          <span className="menu-section-label">Navigation</span>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Tableau de bord</span>
          </button>

          {user.role === 'PATIENT' && (
            <button
              onClick={() => setActiveTab('search')}
              className={`menu-item ${activeTab === 'search' ? 'active' : ''}`}
            >
              <Search size={20} />
              <span>Trouver un médecin</span>
            </button>
          )}

          {user.role === 'PATIENT' && (
            <button
              onClick={() => setActiveTab('teleconsultation')}
              className={`menu-item ${activeTab === 'teleconsultation' ? 'active' : ''}`}
            >
              <Video size={20} />
              <span>Téléconsultations</span>
            </button>
          )}

          {user.role === 'PATIENT' && (
            <button
              onClick={() => setActiveTab('payment')}
              className={`menu-item ${activeTab === 'payment' ? 'active' : ''}`}
            >
              <CreditCard size={20} />
              <span>Paiements</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('notifications')}
            className={`menu-item ${activeTab === 'notifications' ? 'active' : ''}`}
          >
            <Bell size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`menu-item ${activeTab === 'chat' ? 'active' : ''}`}
          >
            <MessageSquare size={20} />
            <span>Messagerie</span>
          </button>

          <span className="menu-section-label">Compte</span>

          <div className="language-selector">
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
            >
              FR
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user.prenom.charAt(0)}{user.nom.charAt(0)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.prenom} {user.nom}</span>
              <span className="sidebar-user-role">{user.role}</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            <h2>{tabLabel[activeTab]}</h2>
          </div>
          <div className="user-profile">
            <div className="info">
              <span className="name">{user.prenom} {user.nom}</span>
              <span className="role-tag">{user.role}</span>
            </div>
            <div className="avatar">{user.prenom.charAt(0)}{user.nom.charAt(0)}</div>
          </div>
        </header>

        <div className="content-area">
          {loading && <div className="loading-spinner">Chargement...</div>}

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && !loading && (
            <div className="dashboard-grid">
              <div className="dashboard-main">
                {/* Stats row */}
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon blue">📅</div>
                    <div className="stat-info">
                      <div className="stat-value">{upcomingCount}</div>
                      <div className="stat-label">À venir</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon amber">⏳</div>
                    <div className="stat-info">
                      <div className="stat-value">{pendingCount}</div>
                      <div className="stat-label">En attente</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div className="stat-info">
                      <div className="stat-value">{completedCount}</div>
                      <div className="stat-label">Confirmés</div>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                <section className="dashboard-section card">
                  <div className="section-header">
                    <h3>📅 Vos Rendez-vous</h3>
                    {user.role === 'PATIENT' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveTab('search')}
                      >
                        + Prendre RDV
                      </button>
                    )}
                  </div>

                  {appointments.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <p>Aucun rendez-vous planifié pour le moment.</p>
                    </div>
                  ) : (
                    <div className="appointments-list">
                      {appointments.map((app) => (
                        <div key={app.id} className="appointment-item">
                          <div className="app-info">
                            <span className="app-doctor">
                              {user.role === 'PATIENT' ? `Dr. ${app.medecinNom}` : app.patientNom}
                            </span>
                            <span className="app-specialty text-muted">{app.specialite}</span>
                            <span className="app-motif">{app.motif}</span>
                          </div>
                          <div className="app-time">
                            <span>{new Date(app.dateHeureDebut).toLocaleDateString('fr-FR')}</span>
                            <span className="text-muted">
                              {new Date(app.dateHeureDebut).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <span className={`status-badge status-${app.statut.toLowerCase()}`}>
                              {app.statut}
                            </span>
                            {/* Doctor can validate/refuse pending appointments */}
                            {user.role === 'MEDECIN' && app.statut === 'EN_ATTENTE' && (
                              <div className="appointment-actions">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleUpdateAppointmentStatus(app.id, 'VALIDE')}
                                >
                                  ✓ Valider
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleUpdateAppointmentStatus(app.id, 'REFUSE')}
                                >
                                  ✗ Refuser
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Aside — Patient documents */}
              {user.role === 'PATIENT' && (
                <div className="dashboard-aside">
                  <section className="dashboard-section card">
                    <div className="section-header">
                      <h3>📂 Documents Médicaux</h3>
                    </div>
                    {docSuccess && <div className="success-banner">{docSuccess}</div>}

                    <form onSubmit={handleUploadDoc} className="mini-form">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          placeholder="Nom du document"
                          className="form-input"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          type="file"
                          className="form-input"
                          onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm">
                        + Ajouter
                      </button>
                    </form>

                    <div className="documents-list">
                      {documents.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">📁</div>
                          <p>Aucun document.</p>
                        </div>
                      ) : (
                        documents.map((doc) => (
                          <div key={doc.id} className="document-item">
                            <span className="doc-icon">📄</span>
                            <div className="doc-details">
                              <a
                                href={`http://localhost:8081/uploads/${doc.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="doc-name"
                              >
                                {doc.nom}
                              </a>
                              <span className="doc-date text-muted">
                                {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {/* ── SEARCH TAB ── */}
          {activeTab === 'search' && user.role === 'PATIENT' && (
            <DoctorSearchTab />
          )}

          {/* ── TELECONSULTATION TAB ── */}
          {activeTab === 'teleconsultation' && user.role === 'PATIENT' && (
            <TeleconsultationTab />
          )}

          {/* ── PAYMENT TAB ── */}
          {activeTab === 'payment' && user.role === 'PATIENT' && (
            <PaymentTab />
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && !loading && (
            <div className="notifications-tab card">
              <div className="section-header">
                <h3>🔔 Vos Notifications</h3>
                {unreadCount > 0 && (
                  <span className="role-tag">{unreadCount} non lue(s)</span>
                )}
              </div>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔕</div>
                    <p>Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${notif.lu ? 'read' : 'unread'}`}
                    >
                      <div className="notif-content">
                        <h4>{notif.titre}</h4>
                        <p>{notif.message}</p>
                        <span className="text-muted">
                          {new Date(notif.dateCreation).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {!notif.lu && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          ✓ Lu
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── CHAT TAB ── */}
          {activeTab === 'chat' && <Chat />}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <PatientProfileTab />
          )}
        </div>
      </main>

      {/* AI Chatbot Widget */}
      <AIChatbot />
    </div>
  );
};
