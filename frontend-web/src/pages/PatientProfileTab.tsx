import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import './PatientProfileTab.css';

export const PatientProfileTab: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    historiqueMedical: '',
    avatarUrl: '',
  });

  const [avatarSuccess, setAvatarSuccess] = useState('');

  // Charger le thème au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Fetch full profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await fetch(`${API_BASE_URL}/profile`, { headers });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            nom: data.nom || '',
            prenom: data.prenom || '',
            telephone: data.telephone || '',
            historiqueMedical: data.patient?.historiqueMedical || '',
            avatarUrl: data.avatarUrl || '',
          });
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du profil', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      };
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du profil.');
      }
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setAvatarSuccess('');
    const form = new FormData();
    form.append('file', file);

    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers,
        body: form,
      });

      if (res.ok) {
        const profileData = await res.json();
        setFormData(prev => ({
          ...prev,
          avatarUrl: profileData.avatarUrl || '',
        }));
        // Mettre à jour le contexte utilisateur pour rafraîchir l'avatar partout
        updateUser({ avatarUrl: profileData.avatarUrl });
        setAvatarSuccess('Avatar mis à jour !');
        setTimeout(() => setAvatarSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-spinner">Chargement du profil...</div>;

  return (
    <div className="patient-profile-wrapper fade-in">
      <div className="profile-header">
        <div className="profile-header-text">
          <h3>Mon Dossier Médical</h3>
          <p className="text-muted">Gérez vos informations personnelles et antécédents médicaux.</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Main Info Form */}
        <div className="profile-card main-form-card">
          <h4>Informations Personnelles</h4>
          {error && <div className="error-message">⚠️ {error}</div>}
          {success && <div className="success-banner">✅ {success}</div>}
          
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input
                  type="text"
                  className="form-input"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  className="form-input"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                className="form-input"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {user?.role === 'PATIENT' && (
              <div className="form-group">
                <label className="form-label">Antécédents / Historique Médical</label>
                <textarea
                  className="form-input"
                  name="historiqueMedical"
                  rows={5}
                  value={formData.historiqueMedical}
                  onChange={handleInputChange}
                  placeholder="Décrivez vos allergies, chirurgies passées, traitements en cours..."
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
              </button>
            </div>
          </form>
        </div>

        {/* Avatar Sidebar */}
        <div className="profile-card avatar-card">
          <h4>Photo de profil</h4>
          <div className="avatar-display">
            {formData.avatarUrl ? (
              <img 
                src={`http://localhost:8081/uploads/${formData.avatarUrl}`} 
                alt="Avatar" 
                className="avatar-image"
              />
            ) : (
              <div className="avatar-circle">
                {formData.prenom.charAt(0)}{formData.nom.charAt(0)}
              </div>
            )}
          </div>
          {avatarSuccess && <div className="success-banner" style={{ marginTop: '16px' }}>✅ {avatarSuccess}</div>}
          <form onSubmit={handleUploadAvatar} className="avatar-form">
            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              required
            />
            <button type="submit" className="btn btn-secondary w-full" disabled={!avatarFile}>
              Mettre à jour l'avatar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
