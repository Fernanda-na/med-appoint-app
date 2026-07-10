import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // La redirection sera gérée par le Dashboard selon le rôle
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container split-layout">
      {/* Panneau gauche — visuel */}
      <div className="login-left-panel">
        <div className="login-panel-logo">🏥</div>
        <h1 className="login-panel-title">Votre santé,<br />notre priorité</h1>
        <p className="login-panel-subtitle">
          Gérez vos rendez-vous médicaux, consultez vos documents et
          communiquez avec votre médecin en temps réel.
        </p>
        <div className="login-panel-badges">
          <div className="login-panel-badge">
            <span className="badge-icon">📅</span>
            <span>Prise de rendez-vous en ligne 24h/24</span>
          </div>
          <div className="login-panel-badge">
            <span className="badge-icon">💬</span>
            <span>Messagerie instantanée avec votre médecin</span>
          </div>
          <div className="login-panel-badge">
            <span className="badge-icon">📂</span>
            <span>Accès à vos documents médicaux sécurisés</span>
          </div>
          <div className="login-panel-badge">
            <span className="badge-icon">🔔</span>
            <span>Rappels de rendez-vous par SMS</span>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="login-right-panel">
        <div className="login-form-wrapper">
          <div className="login-header">
            <span className="brand-logo">🏥</span>
            <h2>Connexion</h2>
            <p>Accédez à votre espace médical personnel</p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Adresse e-mail</label>
              <input
                className="form-input"
                type="email"
                id="email"
                placeholder="ex: jean.dupont@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Mot de passe</label>
              <div className="input-with-icon">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
              id="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Connexion en cours...
                </span>
              ) : (
                'Se connecter →'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Pas encore de compte ?{' '}
              <Link to="/register">Créer un compte gratuit</Link>
            </p>
          </div>

          {/* Comptes de démonstration */}
          <div className="demo-accounts">
            <p className="demo-title">Comptes de démonstration</p>
            <div className="demo-list">
              <button
                className="demo-btn"
                type="button"
                onClick={() => { setEmail('patient@test.com'); setPassword('password123'); }}
              >
                🧑‍💼 Patient
              </button>
              <button
                className="demo-btn"
                type="button"
                onClick={() => { setEmail('doctor@test.com'); setPassword('password123'); }}
              >
                👨‍⚕️ Médecin
              </button>
              <button
                className="demo-btn"
                type="button"
                onClick={() => { setEmail('admin@test.com'); setPassword('password123'); }}
              >
                👨‍💼 Administrateur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
