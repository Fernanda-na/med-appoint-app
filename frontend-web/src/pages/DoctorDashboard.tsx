import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TeleconsultationTab from './TeleconsultationTab';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  MessageSquare, 
  Settings, 
  LogOut,
  Stethoscope
} from 'lucide-react';
import './DoctorDashboard.css';

interface Appointment {
  id: number;
  patientNom: string;
  patientEmail: string;
  medecinNom: string;
  specialite: string;
  dateHeureDebut: string;
  dateHeureFin: string;
  motif: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'ANNULE';
}

interface Availability {
  id: number;
  jourSemaine: string;
  heureDebut: string;
  heureFin: string;
}

interface PatientProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  numeroPatient: string;
  historiqueMedical: string | null;
}

type TabType = 'planning' | 'disponibilites' | 'patients' | 'teleconsultations' | 'messagerie' | 'parametres';

export const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('planning');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en' | 'es' | 'de'>('fr');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // Appliquer le thème au chargement et lors du changement
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLanguageChange = (newLang: 'fr' | 'en' | 'es' | 'de') => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    // Ici on pourrait ajouter la logique de traduction réelle
  };

  // Availability form
  const [newAvailability, setNewAvailability] = useState({
    jourSemaine: 'LUNDI',
    heureDebut: '09:00',
    heureFin: '17:00',
  });

  useEffect(() => {
    if (!user || user.role !== 'MEDECIN') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${user.token}` };

      if (activeTab === 'planning') {
        const resApps = await fetch(`${API_BASE_URL}/appointments/me`, { headers });
        if (resApps.ok) setAppointments(await resApps.json());
      }

      if (activeTab === 'disponibilites') {
        const resAvail = await fetch(`${API_BASE_URL}/doctors/${user.medecinId}/availabilities`, { headers });
        if (resAvail.ok) setAvailabilities(await resAvail.json());
      }

      if (activeTab === 'parametres') {
        const resProfile = await fetch(`${API_BASE_URL}/profile`, { headers });
        if (resProfile.ok) setDoctorProfile(await resProfile.json());
      }
    } catch (e) {
      console.error('Error fetching doctor data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, statut: string) => {
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

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      };
      const res = await fetch(`${API_BASE_URL}/doctors/availability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          medecinId: user.medecinId,
          ...newAvailability,
        }),
      });
      if (res.ok) {
        fetchData();
        setNewAvailability({ jourSemaine: 'LUNDI', heureDebut: '09:00', heureFin: '17:00' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAvailability = async (id: number) => {
    if (!user) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) return;
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await fetch(`${API_BASE_URL}/doctors/availability/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!user) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewPatientProfile = async (patientEmail: string) => {
    if (!user) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${user.token}` };
      
      // Récupérer les rendez-vous pour extraire les infos des patients
      const resApps = await fetch(`${API_BASE_URL}/appointments/me`, { headers });
      if (resApps.ok) {
        const apps = await resApps.json();
        const patientApp = apps.find((a: Appointment) => a.patientEmail === patientEmail);
        if (patientApp) {
          setSelectedPatient({
            id: 0,
            nom: patientApp.patientNom.split(' ')[1] || '',
            prenom: patientApp.patientNom.split(' ')[0] || '',
            email: patientApp.patientEmail,
            telephone: null,
            numeroPatient: 'N/A',
            historiqueMedical: null,
          });
          setShowPatientModal(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const tabLabel: Record<TabType, string> = {
    planning: 'Planning',
    disponibilites: 'Disponibilités',
    patients: 'Patients',
    teleconsultations: 'Téléconsultations',
    messagerie: 'Messagerie',
    parametres: 'Paramètres',
  };

  const daysOrder = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

  if (!user) return null;

  return (
    <div className="doctor-dashboard-wrapper">
      <aside className="sidebar">
        <div className="brand">
          <Stethoscope className="brand-icon" size={28} />
          <span className="name">MedAppoint</span>
        </div>

        <nav className="menu">
          <span className="menu-section-label">Navigation</span>

          <button
            onClick={() => setActiveTab('planning')}
            className={`menu-item ${activeTab === 'planning' ? 'active' : ''}`}
          >
            <Calendar size={20} />
            <span>Planning</span>
          </button>

          <button
            onClick={() => setActiveTab('disponibilites')}
            className={`menu-item ${activeTab === 'disponibilites' ? 'active' : ''}`}
          >
            <Clock size={20} />
            <span>Disponibilités</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`menu-item ${activeTab === 'patients' ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Patients</span>
          </button>

          <button
            onClick={() => setActiveTab('teleconsultations')}
            className={`menu-item ${activeTab === 'teleconsultations' ? 'active' : ''}`}
          >
            <Video size={20} />
            <span>Téléconsultations</span>
          </button>

          <button
            onClick={() => setActiveTab('messagerie')}
            className={`menu-item ${activeTab === 'messagerie' ? 'active' : ''}`}
          >
            <MessageSquare size={20} />
            <span>Messagerie</span>
          </button>

          <span className="menu-section-label">Compte</span>

          <button
            onClick={() => setActiveTab('parametres')}
            className={`menu-item ${activeTab === 'parametres' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user.prenom.charAt(0)}{user.nom.charAt(0)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Dr. {user.prenom} {user.nom}</span>
              <span className="sidebar-user-role">{user.role}</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            <h2>{tabLabel[activeTab]}</h2>
          </div>
          <div className="user-profile">
            <div className="info">
              <span className="name">Dr. {user.prenom} {user.nom}</span>
              <span className="role-tag">{user.role}</span>
            </div>
            <div className="avatar">{user.prenom.charAt(0)}{user.nom.charAt(0)}</div>
          </div>
        </header>

        <div className="content-area">
          {loading && <div className="loading-spinner">Chargement...</div>}

          {/* ── PLANNING TAB ── */}
          {activeTab === 'planning' && !loading && (
            <div className="planning-tab">
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon blue">📅</div>
                  <div className="stat-info">
                    <div className="stat-value">{appointments.length}</div>
                    <div className="stat-label">Total RDV</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon amber">⏳</div>
                  <div className="stat-info">
                    <div className="stat-value">{appointments.filter(a => a.statut === 'EN_ATTENTE').length}</div>
                    <div className="stat-label">En attente</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">✅</div>
                  <div className="stat-info">
                    <div className="stat-value">{appointments.filter(a => a.statut === 'VALIDE').length}</div>
                    <div className="stat-label">Confirmés</div>
                  </div>
                </div>
              </div>

              <section className="dashboard-section card">
                <div className="section-header">
                  <h3>📅 Vos Rendez-vous</h3>
                </div>

                {appointments.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>Aucun rendez-vous planifié.</p>
                  </div>
                ) : (
                  <div className="appointments-list">
                    {appointments.map((app) => (
                      <div key={app.id} className="appointment-item">
                        <div className="app-info">
                          <span className="app-doctor">{app.patientNom}</span>
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
                          {app.statut === 'EN_ATTENTE' && (
                            <div className="appointment-actions">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleUpdateStatus(app.id, 'VALIDE')}
                              >
                                ✓ Valider
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleUpdateStatus(app.id, 'REFUSE')}
                              >
                                ✗ Refuser
                              </button>
                            </div>
                          )}
                          {app.statut !== 'ANNULE' && app.statut !== 'REFUSE' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCancelAppointment(app.id)}
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── DISPONIBILITÉS TAB ── */}
          {activeTab === 'disponibilites' && !loading && (
            <div className="disponibilites-tab">
              <div className="card">
                <div className="section-header">
                  <h3>Ajouter une disponibilité</h3>
                </div>
                <form onSubmit={handleAddAvailability} className="availability-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Jour</label>
                      <select
                        value={newAvailability.jourSemaine}
                        onChange={(e) => setNewAvailability({ ...newAvailability, jourSemaine: e.target.value })}
                        className="form-input"
                      >
                        {daysOrder.map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Heure début</label>
                      <input
                        type="time"
                        value={newAvailability.heureDebut}
                        onChange={(e) => setNewAvailability({ ...newAvailability, heureDebut: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Heure fin</label>
                      <input
                        type="time"
                        value={newAvailability.heureFin}
                        onChange={(e) => setNewAvailability({ ...newAvailability, heureFin: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    + Ajouter
                  </button>
                </form>
              </div>

              <div className="card">
                <div className="section-header">
                  <h3>Vos disponibilités hebdomadaires</h3>
                </div>

                {availabilities.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <p>Aucune disponibilité configurée.</p>
                  </div>
                ) : (
                  <div className="availabilities-list">
                    {availabilities
                      .sort((a, b) => daysOrder.indexOf(a.jourSemaine) - daysOrder.indexOf(b.jourSemaine))
                      .map((avail) => (
                        <div key={avail.id} className="availability-item">
                          <div className="avail-info">
                            <span className="avail-day">{avail.jourSemaine}</span>
                            <span className="avail-hours">
                              {avail.heureDebut} - {avail.heureFin}
                            </span>
                          </div>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteAvailability(avail.id)}
                          >
                            ✗ Supprimer
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PATIENTS TAB ── */}
          {activeTab === 'patients' && !loading && (
            <div className="patients-tab card">
              <div className="section-header">
                <h3>👥 Vos Patients</h3>
              </div>

              {appointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <p>Aucun patient.</p>
                </div>
              ) : (
                <div className="patients-list">
                  {Array.from(new Set(appointments.map(a => a.patientEmail))).map((email) => {
                    const patientApps = appointments.filter(a => a.patientEmail === email);
                    const patientName = patientApps[0].patientNom;
                    return (
                      <div key={email} className="patient-item">
                        <div className="patient-info">
                          <div className="patient-avatar">{patientName.charAt(0)}</div>
                          <div>
                            <span className="patient-name">{patientName}</span>
                            <span className="patient-email">{email}</span>
                            <span className="patient-appointments-count">{patientApps.length} rendez-vous</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleViewPatientProfile(email)}
                        >
                          Voir profil
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TÉLÉCONSULTATIONS TAB ── */}
          {activeTab === 'teleconsultations' && !loading && (
            <TeleconsultationTab />
          )}

          {/* ── MESSAGERIE TAB ── */}
          {activeTab === 'messagerie' && !loading && (
            <div className="card">
              <div className="section-header">
                <h3>✉️ Messagerie</h3>
              </div>
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p>La messagerie sera bientôt disponible.</p>
              </div>
            </div>
          )}

          {/* ── PARAMÈTRES TAB ── */}
          {activeTab === 'parametres' && !loading && (
            <div className="parametres-tab">
              <div className="profile-grid">
                {/* Informations personnelles */}
                <div className="profile-card main-form-card">
                  <h4>Informations Personnelles</h4>
                  {doctorProfile && (
                    <div className="doctor-info-display">
                      <div className="info-row">
                        <span className="info-label">Nom</span>
                        <span className="info-value">{doctorProfile.nom || user.nom}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Prénom</span>
                        <span className="info-value">{doctorProfile.prenom || user.prenom}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Email</span>
                        <span className="info-value">{doctorProfile.email || user.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Téléphone</span>
                        <span className="info-value">{doctorProfile.telephone || 'Non renseigné'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Spécialité</span>
                        <span className="info-value">{doctorProfile.medecin?.specialite?.nom || 'Non renseigné'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Lieu de consultation</span>
                        <span className="info-value">{doctorProfile.medecin?.lieuConsultation || 'Non renseigné'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo de profil */}
                <div className="profile-card avatar-card">
                  <h4>Photo de profil</h4>
                  <div className="avatar-display">
                    {doctorProfile?.avatarUrl ? (
                      <img 
                        src={`http://localhost:8081/uploads/${doctorProfile.avatarUrl}`} 
                        alt="Avatar" 
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-circle">
                        {user.prenom.charAt(0)}{user.nom.charAt(0)}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-secondary w-full">
                    Changer la photo
                  </button>
                </div>
              </div>

              {/* Préférences */}
              <div className="profile-card preferences-card">
                <h4>Préférences</h4>
                
                <div className="preference-section">
                  <label className="preference-label">Langue / Language</label>
                  <div className="language-selector">
                    <button
                      onClick={() => handleLanguageChange('fr')}
                      className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
                    >
                      Français
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('es')}
                      className={`lang-btn ${language === 'es' ? 'active' : ''}`}
                    >
                      Español
                    </button>
                    <button
                      onClick={() => handleLanguageChange('de')}
                      className={`lang-btn ${language === 'de' ? 'active' : ''}`}
                    >
                      Deutsch
                    </button>
                  </div>
                </div>

                <div className="preference-section">
                  <label className="preference-label">Thème</label>
                  <div className="theme-selector">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    >
                      Clair
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    >
                      Sombre
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Patient Profile Modal */}
      {showPatientModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowPatientModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Profil Patient</h3>
              <button className="modal-close" onClick={() => setShowPatientModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="patient-profile-header">
                <div className="patient-profile-avatar">{selectedPatient.prenom.charAt(0)}{selectedPatient.nom.charAt(0)}</div>
                <div>
                  <h4>{selectedPatient.prenom} {selectedPatient.nom}</h4>
                  <span className="patient-number">N° {selectedPatient.numeroPatient}</span>
                </div>
              </div>
              
              <div className="patient-profile-details">
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedPatient.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Téléphone</span>
                  <span className="detail-value">{selectedPatient.telephone || 'Non renseigné'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Historique médical</span>
                  <span className="detail-value">{selectedPatient.historiqueMedical || 'Aucun historique disponible'}</span>
                </div>
              </div>

              <div className="patient-appointments-history">
                <h5>Rendez-vous avec ce patient</h5>
                {appointments
                  .filter(a => a.patientEmail === selectedPatient.email)
                  .map((app) => (
                    <div key={app.id} className="history-item">
                      <span className="history-date">
                        {new Date(app.dateHeureDebut).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(app.dateHeureDebut).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className={`history-status status-${app.statut.toLowerCase()}`}>
                        {app.statut}
                      </span>
                      <span className="history-motif">{app.motif}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
