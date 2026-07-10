import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import './TeleconsultationTab.css';

interface Teleconsultation {
  id: number;
  medecinId: number;
  patientId: number;
  dateHeure: string;
  motif: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  lienVideo?: string;
  duree?: number;
  notesMedecin?: string;
  medecin: {
    user: {
      nom: string;
      prenom: string;
    };
    specialite?: {
      nom: string;
    };
  };
  patient: {
    user: {
      nom: string;
      prenom: string;
    };
  };
}

export default function TeleconsultationTab() {
  const { user } = useAuth();
  const [teleconsultations, setTeleconsultations] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeleconsultation, setSelectedTeleconsultation] = useState<Teleconsultation | null>(null);
  const [newTeleconsultation, setNewTeleconsultation] = useState({
    patientId: '',
    dateHeure: '',
    motif: '',
  });

  const token = user?.token;
  const userRole = user?.role;

  useEffect(() => {
    fetchTeleconsultations();
  }, []);

  const fetchTeleconsultations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teleconsultations/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTeleconsultations(data);
    } catch (error) {
      console.error('Error fetching teleconsultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeleconsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/teleconsultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTeleconsultation),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTeleconsultation({ patientId: '', dateHeure: '', motif: '' });
        fetchTeleconsultations();
      }
    } catch (error) {
      console.error('Error creating teleconsultation:', error);
    }
  };

  const handleJoinVideo = (lienVideo: string) => {
    if (lienVideo) {
      window.open(lienVideo, '_blank');
    }
  };

  const handleUpdateStatus = async (id: number, statut: string) => {
    try {
      await fetch(`${API_BASE_URL}/teleconsultations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut }),
      });
      fetchTeleconsultations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'PLANIFIEE': return '#ffc107';
      case 'EN_COURS': return '#28a745';
      case 'TERMINEE': return '#17a2b8';
      case 'ANNULEE': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div className="teleconsultation-loading">Chargement...</div>;
  }

  return (
    <div className="teleconsultation-container">
      <div className="teleconsultation-header">
        <h2>Téléconsultations</h2>
        {userRole === 'MEDECIN' && (
          <button 
            className="btn-create"
            onClick={() => setShowCreateModal(true)}
          >
            + Nouvelle Téléconsultation
          </button>
        )}
      </div>

      <div className="teleconsultation-list">
        {teleconsultations.length === 0 ? (
          <div className="empty-state">
            <p>Aucune téléconsultation trouvée</p>
          </div>
        ) : (
          teleconsultations.map((teleconsultation) => (
            <div key={teleconsultation.id} className="teleconsultation-card">
              <div className="teleconsultation-info">
                <div className="teleconsultation-header-info">
                  <h3>
                    {userRole === 'PATIENT' 
                      ? `Dr. ${teleconsultation.medecin.user.nom} ${teleconsultation.medecin.user.prenom}`
                      : `${teleconsultation.patient.user.nom} ${teleconsultation.patient.user.prenom}`
                    }
                  </h3>
                  {teleconsultation.medecin.specialite && (
                    <span className="specialty-badge">
                      {teleconsultation.medecin.specialite.nom}
                    </span>
                  )}
                </div>
                <p className="teleconsultation-date">
                  📅 {new Date(teleconsultation.dateHeure).toLocaleString('fr-FR')}
                </p>
                <p className="teleconsultation-motif">
                  📋 {teleconsultation.motif}
                </p>
                {teleconsultation.duree && (
                  <p className="teleconsultation-duration">
                    ⏱️ Durée: {teleconsultation.duree} minutes
                  </p>
                )}
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(teleconsultation.statut) }}
                >
                  {teleconsultation.statut}
                </span>
              </div>

              <div className="teleconsultation-actions">
                {teleconsultation.lienVideo && teleconsultation.statut === 'PLANIFIEE' && (
                  <button 
                    className="btn-join"
                    onClick={() => handleJoinVideo(teleconsultation.lienVideo!)}
                  >
                    📹 Rejoindre la vidéo
                  </button>
                )}
                {userRole === 'MEDECIN' && teleconsultation.statut === 'PLANIFIEE' && (
                  <button 
                    className="btn-start"
                    onClick={() => handleUpdateStatus(teleconsultation.id, 'EN_COURS')}
                  >
                    ▶️ Démarrer
                  </button>
                )}
                {userRole === 'MEDECIN' && teleconsultation.statut === 'EN_COURS' && (
                  <button 
                    className="btn-end"
                    onClick={() => handleUpdateStatus(teleconsultation.id, 'TERMINEE')}
                  >
                    ⏹️ Terminer
                  </button>
                )}
                {teleconsultation.statut === 'PLANIFIEE' && (
                  <button 
                    className="btn-cancel"
                    onClick={() => handleUpdateStatus(teleconsultation.id, 'ANNULEE')}
                  >
                    ❌ Annuler
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nouvelle Téléconsultation</h3>
              <button 
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTeleconsultation}>
              <div className="form-group">
                <label>Patient</label>
                <input
                  type="text"
                  placeholder="ID du patient"
                  value={newTeleconsultation.patientId}
                  onChange={(e) => setNewTeleconsultation({...newTeleconsultation, patientId: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date et heure</label>
                <input
                  type="datetime-local"
                  value={newTeleconsultation.dateHeure}
                  onChange={(e) => setNewTeleconsultation({...newTeleconsultation, dateHeure: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Motif</label>
                <textarea
                  placeholder="Motif de la téléconsultation"
                  value={newTeleconsultation.motif}
                  onChange={(e) => setNewTeleconsultation({...newTeleconsultation, motif: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
