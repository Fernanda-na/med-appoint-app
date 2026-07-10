import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import './BookAppointment.css';

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

export const BookAppointment: React.FC = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [motif, setMotif] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate next 7 available weekdays
  const [availableDates, setAvailableDates] = useState<{ date: Date, label: string }[]>([]);

  useEffect(() => {
    // Generate dates
    const dates = [];
    let d = new Date();
    d.setHours(0, 0, 0, 0); // Start from today
    
    // Add tomorrow as first available slot or today if early enough
    d.setDate(d.getDate() + 1); 

    while (dates.length < 10) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        dates.push({
          date: new Date(d),
          label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        });
      }
      d.setDate(d.getDate() + 1);
    }
    setAvailableDates(dates);
  }, []);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!user || !doctorId) return;
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await fetch(`${API_BASE_URL}/doctors`, { headers });
        if (res.ok) {
          const doctors: Doctor[] = await res.json();
          const doc = doctors.find(d => d.id === parseInt(doctorId));
          if (doc) {
            setDoctor(doc);
          } else {
            setError('Médecin introuvable.');
          }
        }
      } catch (e) {
        setError('Erreur de connexion serveur.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [user, doctorId]);

  // Generate time slots (9h - 17h, every 30 mins)
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 9; h < 17; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  const handleBooking = async () => {
    if (!user || !doctor || !selectedDate || !selectedTime || !motif) return;
    setIsSubmitting(true);
    setError('');

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      };

      const res = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          medecinId: doctor.id,
          dateHeureDebut: startDateTime.toISOString(),
          motif,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la réservation.');

      // Success! Navigate back to dashboard with success state (can be handled via local state or simply reload dashboard)
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="book-container"><div className="loading-spinner">Chargement du profil...</div></div>;
  if (error && !doctor) return <div className="book-container"><div className="error-message">{error}</div><button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Retour</button></div>;
  if (!doctor) return null;

  return (
    <div className="book-container">
      <div className="book-header">
        <button className="btn-icon back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <h2>Prendre un rendez-vous</h2>
      </div>

      <div className="book-content card">
        {/* Doctor Summary Header */}
        <div className="doc-summary-banner">
          <div className="doc-avatar-large">
            {doctor.prenom.charAt(0)}{doctor.nom.charAt(0)}
          </div>
          <div className="doc-summary-info">
            <h3>Dr. {doctor.prenom} {doctor.nom}</h3>
            <span className="role-tag">{doctor.specialite?.nom || 'Généraliste'}</span>
            <p className="text-muted">📍 {doctor.lieuConsultation || 'Cabinet médical'}</p>
          </div>
        </div>

        {/* Wizard Progress */}
        <div className="wizard-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Date</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Heure</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Confirmation</div>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        {/* STEP 1: DATE SELECTION */}
        {step === 1 && (
          <div className="wizard-step step-1 fade-in">
            <h4>Choisissez une date</h4>
            <div className="date-grid">
              {availableDates.map((item, idx) => {
                const dateStr = item.date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={idx}
                    className={`date-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <span className="date-day">{item.label.split(' ')[0]}</span>
                    <span className="date-number">{item.label.split(' ')[1]}</span>
                    <span className="date-month">{item.label.split(' ')[2]}</span>
                  </button>
                );
              })}
            </div>
            <div className="wizard-actions">
              <button 
                className="btn btn-primary" 
                disabled={!selectedDate} 
                onClick={() => setStep(2)}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TIME SELECTION */}
        {step === 2 && (
          <div className="wizard-step step-2 fade-in">
            <h4>Choisissez une heure pour le {new Date(selectedDate).toLocaleDateString('fr-FR')}</h4>
            <div className="time-grid">
              {timeSlots.map((time, idx) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={idx}
                    className={`time-slot ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
            <div className="wizard-actions dual">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Retour</button>
              <button 
                className="btn btn-primary" 
                disabled={!selectedTime} 
                onClick={() => setStep(3)}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MOTIF & CONFIRMATION */}
        {step === 3 && (
          <div className="wizard-step step-3 fade-in">
            <h4>Dernière étape : Motif de consultation</h4>
            <div className="confirmation-summary">
              <p>🗓️ <strong>Date :</strong> {new Date(selectedDate).toLocaleDateString('fr-FR')}</p>
              <p>🕒 <strong>Heure :</strong> {selectedTime}</p>
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label">Pourquoi venez-vous consulter ?</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Ex: Douleurs au dos depuis 3 jours, renouvellement d'ordonnance..."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                required
              />
            </div>

            <div className="wizard-actions dual">
              <button className="btn btn-secondary" onClick={() => setStep(2)} disabled={isSubmitting}>← Retour</button>
              <button 
                className="btn btn-primary" 
                disabled={!motif || isSubmitting} 
                onClick={handleBooking}
              >
                {isSubmitting ? 'Réservation en cours...' : 'Confirmer le rendez-vous ✅'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
