import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import './DoctorSearchTab.css';

export interface Specialty {
  id: number;
  nom: string;
}

export interface Doctor {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  lieuConsultation: string;
  specialite: Specialty | null;
  avatarUrl: string | null;
}

export interface AIRecommendedDoctor extends Doctor {
  score: number;
  reasons: string[];
  availabilities: any[];
}

export const DoctorSearchTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendedDoctor[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');

  useEffect(() => {
    const fetchSearchData = async () => {
      if (!user) return;
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        
        // Fetch all doctors and filter on frontend for faster UX
        const resDocs = await fetch(`${API_BASE_URL}/doctors`, { headers });
        if (resDocs.ok) setDoctors(await resDocs.json());

        const resSpecs = await fetch(`${API_BASE_URL}/doctors/specialties`, { headers });
        if (resSpecs.ok) setSpecialties(await resSpecs.json());
      } catch (err) {
        console.error('Error fetching doctors data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSearchData();
  }, [user]);

  // Filter doctors based on search term and selected specialty
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchName = 
        doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
        doc.prenom.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSpecialty = 
        selectedSpecialty === '' || 
        doc.specialite?.nom === selectedSpecialty;

      return matchName && matchSpecialty;
    });
  }, [doctors, searchTerm, selectedSpecialty]);

  const handleGetAIRecommendations = async () => {
    if (!user) return;
    setAiLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      };
      const response = await fetch(`${API_BASE_URL}/ai/recommend`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symptoms: symptoms || undefined,
          specialty: selectedSpecialty || undefined,
          location: preferredLocation || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setAiRecommendations(data.recommendations);
        setShowAI(true);
      }
    } catch (error) {
      console.error('AI recommendation error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">Recherche des médecins...</div>;

  return (
    <div className="search-tab-wrapper fade-in">
      {/* Premium Search Header */}
      <div className="search-header-banner">
        <h2>Trouvez votre médecin</h2>
        <p>Prenez rendez-vous en ligne avec les meilleurs spécialistes.</p>
        
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="premium-search-input"
            placeholder="Rechercher par nom de médecin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Specialty Pills */}
      <div className="specialty-pills-container">
        <button
          className={`specialty-pill ${selectedSpecialty === '' ? 'active' : ''}`}
          onClick={() => setSelectedSpecialty('')}
        >
          Toutes les spécialités
        </button>
        {specialties.map((spec) => (
          <button
            key={spec.id}
            className={`specialty-pill ${selectedSpecialty === spec.nom ? 'active' : ''}`}
            onClick={() => setSelectedSpecialty(spec.nom)}
          >
            {spec.nom}
          </button>
        ))}
      </div>

      {/* AI Recommendation Section */}
      <div className="ai-recommendation-section">
        <div className="ai-header">
          <span className="ai-icon">🤖</span>
          <h3>Recommandations IA</h3>
          <button
            className="ai-toggle-btn"
            onClick={() => setShowAI(!showAI)}
          >
            {showAI ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        
        {showAI && (
          <div className="ai-content">
            <div className="ai-inputs">
              <input
                type="text"
                className="ai-input"
                placeholder="Décrivez vos symptômes (ex: mal de tête, douleur thoracique...)"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
              <input
                type="text"
                className="ai-input"
                placeholder="Lieu préféré (ex: Paris, Centre...)"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
              />
              <button
                className="btn btn-primary ai-btn"
                onClick={handleGetAIRecommendations}
                disabled={aiLoading}
              >
                {aiLoading ? 'Analyse en cours...' : '🔮 Obtenir des recommandations'}
              </button>
            </div>

            {aiRecommendations.length > 0 && (
              <div className="ai-results">
                <h4>Médecins recommandés pour vous</h4>
                <div className="ai-doctors-list">
                  {aiRecommendations.map((doc, index) => (
                    <div key={doc.id} className="ai-doctor-item">
                      <div className="ai-rank">#{index + 1}</div>
                      <div className="ai-doctor-info">
                        <span className="ai-doctor-name">Dr. {doc.prenom} {doc.nom}</span>
                        <span className="ai-doctor-specialty">{doc.specialite?.nom || 'Généraliste'}</span>
                        <span className="ai-doctor-score">Score de compatibilité: {doc.score}%</span>
                      </div>
                      <button
                        onClick={() => navigate('/book/' + doc.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Prendre RDV
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="results-info">
        <h3>{filteredDoctors.length} résultat{filteredDoctors.length > 1 ? 's' : ''}</h3>
      </div>

      <div className="doctors-grid premium-grid">
        {filteredDoctors.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">🩺</div>
            <h4>Aucun médecin trouvé</h4>
            <p className="text-muted">Essayez de modifier vos critères de recherche.</p>
            <button className="btn btn-secondary mt-4" onClick={() => { setSearchTerm(''); setSelectedSpecialty(''); }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredDoctors.map((doc) => (
            <div key={doc.id} className="premium-doctor-card">
              <div className="card-top-accent"></div>
              <div className="doc-avatar-wrapper">
                {doc.avatarUrl ? (
                  <img src={doc.avatarUrl} alt={`Dr ${doc.nom}`} className="doc-avatar-img" />
                ) : (
                  <div className="doc-avatar-placeholder">
                    {doc.prenom.charAt(0)}{doc.nom.charAt(0)}
                  </div>
                )}
              </div>
              <div className="doc-info-body">
                <h4 className="doc-name">Dr. {doc.prenom} {doc.nom}</h4>
                <span className="specialty-badge">{doc.specialite?.nom || 'Généraliste'}</span>
                
                <div className="doc-details-list">
                  <div className="doc-detail-item">
                    <span className="detail-icon">📍</span>
                    <span>{doc.lieuConsultation || 'Non renseigné'}</span>
                  </div>
                  <div className="doc-detail-item">
                    <span className="detail-icon">📞</span>
                    <span>{doc.telephone || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>
              
              <div className="doc-card-actions">
                <button
                  onClick={() => navigate('/book/' + doc.id)}
                  className="btn btn-primary w-full shadow-hover"
                >
                  Prendre RDV
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
