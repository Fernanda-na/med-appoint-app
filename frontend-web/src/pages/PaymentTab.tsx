import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import './PaymentTab.css';

interface Payment {
  id: number;
  rendezVousId?: number;
  patientId: number;
  montant: number;
  datePaiement: string;
  methode: string;
  statut: 'EN_ATTENTE' | 'PAYE' | 'REFUSE' | 'REMBOURSE';
  reference?: string;
  rendezVous?: {
    medecin: {
      user: {
        nom: string;
        prenom: string;
      };
      specialite?: {
        nom: string;
      };
    };
  };
}

export default function PaymentTab() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    rendezVousId: '',
    montant: '',
    methode: 'MOBILE_MONEY',
  });

  const token = user?.token;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPayment),
      });

      if (response.ok) {
        setShowPaymentModal(false);
        setNewPayment({ rendezVousId: '', montant: '', methode: 'MOBILE_MONEY' });
        fetchPayments();
      }
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return '#ffc107';
      case 'PAYE': return '#28a745';
      case 'REFUSE': return '#dc3545';
      case 'REMBOURSE': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getMethodIcon = (methode: string) => {
    switch (methode) {
      case 'CARTE': return '💳';
      case 'MOBILE_MONEY': return '📱';
      case 'ESPECES': return '💵';
      default: return '💰';
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + p.montant, 0);
  const paidAmount = payments.filter(p => p.statut === 'PAYE').reduce((sum, p) => sum + p.montant, 0);
  const pendingAmount = payments.filter(p => p.statut === 'EN_ATTENTE').reduce((sum, p) => sum + p.montant, 0);

  if (loading) {
    return <div className="payment-loading">Chargement...</div>;
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h2>Paiements</h2>
        <button 
          className="btn-create"
          onClick={() => setShowPaymentModal(true)}
        >
          + Nouveau Paiement
        </button>
      </div>

      <div className="payment-summary">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-info">
            <p className="summary-label">Total</p>
            <p className="summary-value">{totalAmount.toLocaleString()} FCFA</p>
          </div>
        </div>
        <div className="summary-card success">
          <div className="summary-icon">✅</div>
          <div className="summary-info">
            <p className="summary-label">Payé</p>
            <p className="summary-value">{paidAmount.toLocaleString()} FCFA</p>
          </div>
        </div>
        <div className="summary-card warning">
          <div className="summary-icon">⏳</div>
          <div className="summary-info">
            <p className="summary-label">En attente</p>
            <p className="summary-value">{pendingAmount.toLocaleString()} FCFA</p>
          </div>
        </div>
      </div>

      <div className="payment-list">
        {payments.length === 0 ? (
          <div className="empty-state">
            <p>Aucun paiement trouvé</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="payment-card">
              <div className="payment-info">
                <div className="payment-header-info">
                  <h3>{getMethodIcon(payment.methode)} {payment.methode}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(payment.statut) }}
                  >
                    {payment.statut}
                  </span>
                </div>
                <p className="payment-amount">
                  💵 {payment.montant.toLocaleString()} FCFA
                </p>
                <p className="payment-date">
                  📅 {new Date(payment.datePaiement).toLocaleString('fr-FR')}
                </p>
                {payment.reference && (
                  <p className="payment-reference">
                  🔖 Réf: {payment.reference}
                  </p>
                )}
                {payment.rendezVous && (
                  <p className="payment-doctor">
                    👨‍⚕️ Dr. {payment.rendezVous.medecin.user.nom}
                    {payment.rendezVous.medecin.specialite && (
                      <span> - {payment.rendezVous.medecin.specialite.nom}</span>
                    )}
                  </p>
                )}
              </div>

              <div className="payment-actions">
                {payment.statut === 'EN_ATTENTE' && (
                  <button className="btn-pay">
                    💳 Payer maintenant
                  </button>
                )}
                {payment.statut === 'PAYE' && (
                  <button className="btn-receipt">
                    📄 Reçu
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nouveau Paiement</h3>
              <button 
                className="btn-close"
                onClick={() => setShowPaymentModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label>Rendez-vous (optionnel)</label>
                <input
                  type="text"
                  placeholder="ID du rendez-vous"
                  value={newPayment.rendezVousId}
                  onChange={(e) => setNewPayment({...newPayment, rendezVousId: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Montant (FCFA)</label>
                <input
                  type="number"
                  placeholder="Montant"
                  value={newPayment.montant}
                  onChange={(e) => setNewPayment({...newPayment, montant: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Méthode de paiement</label>
                <select
                  value={newPayment.methode}
                  onChange={(e) => setNewPayment({...newPayment, methode: e.target.value})}
                >
                  <option value="MOBILE_MONEY">📱 Mobile Money</option>
                  <option value="CARTE">💳 Carte bancaire</option>
                  <option value="ESPECES">💵 Espèces</option>
                </select>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowPaymentModal(false)}
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
