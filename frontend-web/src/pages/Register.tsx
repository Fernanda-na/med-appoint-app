import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const roles = [
  { value: 'PATIENT', icon: '🧑‍💼', label: 'Patient', desc: 'Je prends des rendez-vous' },
  { value: 'MEDECIN', icon: '👨‍⚕️', label: 'Médecin', desc: 'Je gère mes consultations' },
] as const;

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'PATIENT' | 'MEDECIN'>('PATIENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(nom, prenom, email, password, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container split-layout">
      {/* Panneau gauche — visuel */}
      <div className="login-left-panel">
        <div className="login-panel-logo">🏥</div>
        <h1 className="login-panel-title">Rejoignez<br />MedAppoint</h1>
        <p className="login-panel-subtitle">
          Créez votre compte en quelques secondes et accédez à l'ensemble
          de nos services médicaux en ligne.
        </p>
        <div className="login-panel-badges">
          <div className="login-panel-badge">
            <span className="badge-icon">✅</span>
            <span>Inscription gratuite et sécurisée</span>
          </div>
          <div className="login-panel-badge">
            <span className="badge-icon">🔒</span>
            <span>Vos données sont chiffrées et protégées</span>
          </div>
          <div className="login-panel-badge">
            <span className="badge-icon">⚡</span>
            <span>Accès immédiat après inscription</span>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="login-right-panel">
        <div className="login-form-wrapper" style={{ maxWidth: 480 }}>
          <div className="login-header">
            <span className="brand-logo">🏥</span>
            <h2>Créer un compte</h2>
            <p>Rejoignez MedAppoint en quelques secondes</p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Sélection du rôle */}
            <div className="form-group">
              <label className="form-label">Je suis un...</label>
              <div className="role-cards">
                {roles.map((r) => (
                  <div
                    key={r.value}
                    className={`role-card-option ${role === r.value ? 'selected' : ''}`}
                    onClick={() => setRole(r.value)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setRole(r.value)}
                  >
                    <div className="role-icon">{r.icon}</div>
                    <div className="role-label">{r.label}</div>
                    <div className="role-desc">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prénom / Nom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="prenom">Prénom</label>
                <input
                  className="form-input"
                  type="text"
                  id="prenom"
                  placeholder="Jean"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="nom">Nom</label>
                <input
                  className="form-input"
                  type="text"
                  id="nom"
                  placeholder="Dupont"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Adresse e-mail</label>
              <input
                className="form-input"
                type="email"
                id="reg-email"
                placeholder="jean.dupont@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Mot de passe</label>
              <div className="input-with-icon">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  id="reg-password"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary login-btn"
              type="submit"
              id="register-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Création du compte...
                </span>
              ) : (
                "Créer mon compte →"
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Déjà inscrit ?{' '}
              <Link to="/login">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
