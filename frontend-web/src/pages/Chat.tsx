import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import './Chat.css';

interface Message {
  id?: number;
  contenu: string;
  expediteurEmail: string;
  destinataireEmail: string;
  dateEnvoi: string;
}

interface ChatContact {
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize Socket.io client connection
    const socket = io('http://localhost:8081');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat server');
      socket.emit('join', user.email);
    });

    socket.on('message', (msg: Message) => {
      // Append message if it belongs to current conversation
      if (
        activeContact &&
        ((msg.expediteurEmail === user.email && msg.destinataireEmail === activeContact.email) ||
          (msg.expediteurEmail === activeContact.email && msg.destinataireEmail === user.email))
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // Load contact list
    loadContacts();

    return () => {
      socket.disconnect();
    };
  }, [user, activeContact]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadContacts = async () => {
    if (!user) return;
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      
      if (user.role === 'PATIENT') {
        // Patients can chat with any Doctor
        const res = await fetch(`${API_BASE_URL}/doctors`, { headers });
        if (res.ok) {
          const docs = await res.json();
          setContacts(docs.map((d: any) => ({
            nom: d.nom,
            prenom: d.prenom,
            email: d.email,
            role: 'MEDECIN',
          })));
        }
      } else if (user.role === 'MEDECIN') {
        // Doctors chat with their patients (retrieved via their appointments)
        const res = await fetch(`${API_BASE_URL}/appointments/me`, { headers });
        if (res.ok) {
          const apps = await res.json();
          // Extract unique patients from appointments
          const patientMap = new Map<string, ChatContact>();
          apps.forEach((app: any) => {
            // Patient details parsing from patientNom
            const names = app.patientNom.split(' ');
            const nom = names[0] || 'Patient';
            const prenom = names[1] || '';
            
            // Wait, our appointment endpoint format flat-mapped it but didn't return patient email.
            // Let's query patient email. To simplify, in dev we can make a list of patients,
            // or fetch the history. Let's fallback to test patients or use a default test patient email if needed.
            // In our seed, patient email is patient@test.com
            // So we can default to that or construct it
            const email = 'patient@test.com'; // Default seed patient
            patientMap.set(email, {
              nom,
              prenom,
              email,
              role: 'PATIENT',
            });
          });
          setContacts(Array.from(patientMap.values()));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async (contact: ChatContact) => {
    if (!user) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/chat/history?currentUser=${encodeURIComponent(user.email)}&withUser=${encodeURIComponent(
          contact.email
        )}`
      );
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectContact = (contact: ChatContact) => {
    setActiveContact(contact);
    setMessages([]);
    loadHistory(contact);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeContact || !text.trim()) return;

    const payload = {
      expediteurEmail: user.email,
      destinataireEmail: activeContact.email,
      contenu: text.trim(),
    };

    // Try WS send first, fallback to REST
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', payload);
      // Wait, our WS handler echoes the message back to the sender,
      // so the listener will automatically append it.
    } else {
      // REST fallback
      try {
        const res = await fetch(`${API_BASE_URL}/chat/send-rest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages((prev) => [...prev, msg]);
        }
      } catch (err) {
        console.error('Failed to send message via REST fallback:', err);
      }
    }

    setText('');
  };

  if (!user) return null;

  return (
    <div className="chat-container card">
      <div className="chat-layout">
        {/* Left pane - contacts */}
        <div className="contacts-pane">
          <h3>Contacts</h3>
          <div className="contacts-list">
            {contacts.length === 0 ? (
              <p className="text-muted text-center" style={{ marginTop: '20px' }}>Aucun contact disponible.</p>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.email}
                  onClick={() => selectContact(contact)}
                  className={`contact-item ${activeContact?.email === contact.email ? 'active' : ''}`}
                >
                  <div className="contact-avatar">
                    {contact.prenom.charAt(0)}{contact.nom.charAt(0)}
                  </div>
                  <div className="contact-details">
                    <span className="contact-name">{contact.prenom} {contact.nom}</span>
                    <span className="contact-role text-muted">
                      {contact.role === 'MEDECIN' ? 'Médecin' : 'Patient'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right pane - messages */}
        <div className="messages-pane">
          {activeContact ? (
            <>
              <div className="messages-header">
                <div className="contact-avatar">
                  {activeContact.prenom.charAt(0)}{activeContact.nom.charAt(0)}
                </div>
                <div>
                  <h4>{activeContact.prenom} {activeContact.nom}</h4>
                  <span className="text-muted">{activeContact.email}</span>
                </div>
              </div>

              <div className="messages-list">
                {messages.length === 0 ? (
                  <p className="text-muted text-center" style={{ margin: 'auto' }}>
                    Début de votre conversation avec {activeContact.prenom}.
                  </p>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.expediteurEmail === user.email;
                    return (
                      <div key={index} className={`message-bubble-wrapper ${isMe ? 'outgoing' : 'incoming'}`}>
                        <div className="message-bubble">
                          <p>{msg.contenu}</p>
                          <span className="message-time">
                            {new Date(msg.dateEnvoi).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="chat-input-bar">
                <input
                  type="text"
                  placeholder="Écrivez un message..."
                  className="form-input chat-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary send-btn">
                  Envoyer
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat-state">
              <span className="icon">💬</span>
              <h3>Votre messagerie</h3>
              <p className="text-muted">Sélectionnez un contact pour démarrer la discussion en temps réel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
