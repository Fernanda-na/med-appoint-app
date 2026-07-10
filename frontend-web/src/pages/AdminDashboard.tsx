import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: string;
  avatarUrl: string | null;
}

interface Doctor {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  lieuConsultation: string | null;
  specialite: { id: number; nom: string } | null;
}

interface Appointment {
  id: number;
  patientNom: string;
  patientEmail: string;
  medecinNom: string;
  medecinEmail: string;
  specialite: string;
  dateHeureDebut: string;
  dateHeureFin: string;
  motif: string;
  statut: string;
}

interface Statistics {
  totalAppointments: number;
  appointmentsThisMonth: number;
  appointmentsByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
  topSpecialties: Array<{ specialite: string; count: number }>;
  cancellationRate: number;
}

type TabType = 'dashboard' | 'users' | 'doctors' | 'appointments';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'PATIENT',
    telephone: '',
  });

  const [newDoctor, setNewDoctor] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: '',
    specialiteId: '',
    lieuConsultation: 'Cabinet Médical',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ADMINISTRATEUR') {
      // Rediriger vers le dashboard approprié selon le rôle
      if (user.role === 'MEDECIN') {
        navigate('/doctor-dashboard');
      } else if (user.role === 'PATIENT') {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
      return;
    }
    fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${user.token}` };

      if (activeTab === 'dashboard') {
        const resStats = await fetch(`${API_BASE_URL}/admin/statistics`, { headers });
        if (resStats.ok) setStatistics(await resStats.json());
      }

      if (activeTab === 'users') {
        const resUsers = await fetch(`${API_BASE_URL}/admin/users`, { headers });
        if (resUsers.ok) setUsers(await resUsers.json());
      }

      if (activeTab === 'doctors') {
        const resDocs = await fetch(`${API_BASE_URL}/doctors`, { headers });
        if (resDocs.ok) setDoctors(await resDocs.json());
        const resSpecs = await fetch(`${API_BASE_URL}/doctors/specialties`, { headers });
        if (resSpecs.ok) setSpecialties(await resSpecs.json());
      }

      if (activeTab === 'appointments') {
        const resApps = await fetch(`${API_BASE_URL}/admin/appointments`, { headers });
        if (resApps.ok) setAppointments(await resApps.json());
      }
    } catch (e) {
      console.error('Error fetching admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      };
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        fetchData();
        setNewUser({ nom: '', prenom: '', email: '', password: '', role: 'PATIENT', telephone: '' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!user) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      };
      const res = await fetch(`${API_BASE_URL}/admin/doctors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newDoctor),
      });
      if (res.ok) {
        fetchData();
        setNewDoctor({
          nom: '',
          prenom: '',
          email: '',
          password: '',
          telephone: '',
          specialiteId: '',
          lieuConsultation: 'Cabinet Médical',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!user) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) return;
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await fetch(`${API_BASE_URL}/admin/doctors/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const tabLabel: Record<TabType, string> = {
    dashboard: 'Tableau de bord',
    users: 'Utilisateurs',
    doctors: 'Médecins',
    appointments: 'Rendez-vous',
  };

  if (!user) return null;

  return (
    <div className="admin-dashboard-wrapper">
      <aside className="sidebar">
        <div className="brand">
          <span className="icon">🏥</span>
          <span className="name">MedAppoint Admin</span>
        </div>

        <nav className="menu">
          <span className="menu-section-label">Navigation</span>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <span className="icon">📊</span>
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <span className="icon">👥</span>
            <span>Utilisateurs</span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`menu-item ${activeTab === 'doctors' ? 'active' : ''}`}
          >
            <span className="icon">👨‍⚕️</span>
            <span>Médecins</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`menu-item ${activeTab === 'appointments' ? 'active' : ''}`}
          >
            <span className="icon">📅</span>
            <span>Rendez-vous</span>
          </button>

          <span className="menu-section-label">Compte</span>

          <button onClick={logout} className="logout-btn">
            <span className="icon">🚪</span>
            <span>Déconnexion</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user.prenom.charAt(0)}{user.nom.charAt(0)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.prenom} {user.nom}</span>
              <span className="sidebar-user-role">Administrateur</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            <h2>{tabLabel[activeTab]}</h2>
          </div>
          <div className="user-profile">
            <div className="info">
              <span className="name">{user.prenom} {user.nom}</span>
              <span className="role-tag">ADMIN</span>
            </div>
            <div className="avatar">{user.prenom.charAt(0)}{user.nom.charAt(0)}</div>
          </div>
        </header>

        <div className="content-area">
          {loading && <div className="loading-spinner">Chargement...</div>}

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && !loading && statistics && (
            <div className="dashboard-tab">
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon blue">📅</div>
                  <div className="stat-info">
                    <div className="stat-value">{statistics.totalAppointments}</div>
                    <div className="stat-label">Total RDV</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon amber">📆</div>
                  <div className="stat-info">
                    <div className="stat-value">{statistics.appointmentsThisMonth}</div>
                    <div className="stat-label">Ce mois</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">👥</div>
                  <div className="stat-info">
                    <div className="stat-value">{statistics.usersByRole.PATIENT || 0}</div>
                    <div className="stat-label">Patients</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon red">📉</div>
                  <div className="stat-info">
                    <div className="stat-value">{statistics.cancellationRate}%</div>
                    <div className="stat-label">Taux annulation</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="card">
                  <div className="section-header">
                    <h3>Répartition par statut</h3>
                  </div>
                  <div className="status-breakdown">
                    {Object.entries(statistics.appointmentsByStatus).map(([status, count]) => (
                      <div key={status} className="status-item">
                        <span className="status-label">{status}</span>
                        <span className="status-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="section-header">
                    <h3>Spécialités les plus sollicitées</h3>
                  </div>
                  <div className="specialties-list">
                    {statistics.topSpecialties.map((item, index) => (
                      <div key={index} className="specialty-item">
                        <span className="specialty-rank">#{index + 1}</span>
                        <span className="specialty-name">{item.specialite}</span>
                        <span className="specialty-count">{item.count} RDV</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="section-header">
                    <h3>Utilisateurs par rôle</h3>
                  </div>
                  <div className="roles-breakdown">
                    {Object.entries(statistics.usersByRole).map(([role, count]) => (
                      <div key={role} className="role-item">
                        <span className="role-label">{role}</span>
                        <span className="role-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && !loading && (
            <div className="users-tab">
              <div className="card">
                <div className="section-header">
                  <h3>Ajouter un utilisateur</h3>
                </div>
                <form onSubmit={handleCreateUser} className="user-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nom</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newUser.nom}
                        onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Prénom</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newUser.prenom}
                        onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mot de passe</label>
                      <input
                        type="password"
                        className="form-input"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Rôle</label>
                      <select
                        className="form-input"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      >
                        <option value="PATIENT">Patient</option>
                        <option value="MEDECIN">Médecin</option>
                        <option value="RECEPTIONNISTE">Réceptionniste</option>
                        <option value="ADMINISTRATEUR">Administrateur</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={newUser.telephone}
                        onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    + Créer utilisateur
                  </button>
                </form>
              </div>

              <div className="card">
                <div className="section-header">
                  <h3>Liste des utilisateurs ({users.length})</h3>
                </div>

                {users.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <p>Aucun utilisateur.</p>
                  </div>
                ) : (
                  <div className="users-list">
                    {users.map((u) => (
                      <div key={u.id} className="user-item">
                        <div className="user-info">
                          <div className="user-avatar">{u.prenom.charAt(0)}{u.nom.charAt(0)}</div>
                          <div>
                            <span className="user-name">{u.prenom} {u.nom}</span>
                            <span className="user-email">{u.email}</span>
                          </div>
                        </div>
                        <div className="user-meta">
                          <span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role}</span>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DOCTORS TAB ── */}
          {activeTab === 'doctors' && !loading && (
            <div className="doctors-tab">
              <div className="card">
                <div className="section-header">
                  <h3>Ajouter un médecin</h3>
                </div>
                <form onSubmit={handleCreateDoctor} className="doctor-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nom</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newDoctor.nom}
                        onChange={(e) => setNewDoctor({ ...newDoctor, nom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Prénom</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newDoctor.prenom}
                        onChange={(e) => setNewDoctor({ ...newDoctor, prenom: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={newDoctor.email}
                        onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mot de passe</label>
                      <input
                        type="password"
                        className="form-input"
                        value={newDoctor.password}
                        onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Spécialité</label>
                      <select
                        className="form-input"
                        value={newDoctor.specialiteId}
                        onChange={(e) => setNewDoctor({ ...newDoctor, specialiteId: e.target.value })}
                      >
                        <option value="">Aucune</option>
                        {specialties.map((s) => (
                          <option key={s.id} value={s.id}>{s.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Lieu de consultation</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newDoctor.lieuConsultation}
                        onChange={(e) => setNewDoctor({ ...newDoctor, lieuConsultation: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={newDoctor.telephone}
                        onChange={(e) => setNewDoctor({ ...newDoctor, telephone: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    + Créer médecin
                  </button>
                </form>
              </div>

              <div className="card">
                <div className="section-header">
                  <h3>Liste des médecins ({doctors.length})</h3>
                </div>

                {doctors.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👨‍⚕️</div>
                    <p>Aucun médecin.</p>
                  </div>
                ) : (
                  <div className="doctors-list">
                    {doctors.map((d) => (
                      <div key={d.id} className="doctor-item">
                        <div className="doctor-info">
                          <div className="doctor-avatar">{d.prenom.charAt(0)}{d.nom.charAt(0)}</div>
                          <div>
                            <span className="doctor-name">Dr. {d.prenom} {d.nom}</span>
                            <span className="doctor-email">{d.email}</span>
                            <span className="doctor-specialty">{d.specialite?.nom || 'Généraliste'}</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteDoctor(d.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── APPOINTMENTS TAB ── */}
          {activeTab === 'appointments' && !loading && (
            <div className="appointments-tab card">
              <div className="section-header">
                <h3>Tous les rendez-vous ({appointments.length})</h3>
              </div>

              {appointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <p>Aucun rendez-vous.</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {appointments.map((app) => (
                    <div key={app.id} className="appointment-item">
                      <div className="app-info">
                        <span className="app-patient">{app.patientNom}</span>
                        <span className="app-doctor">{app.medecinNom}</span>
                        <span className="app-specialty">{app.specialite}</span>
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
                      <span className={`status-badge status-${app.statut.toLowerCase()}`}>
                        {app.statut}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
