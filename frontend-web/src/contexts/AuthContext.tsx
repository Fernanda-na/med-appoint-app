import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  nom: string;
  prenom: string;
  email: string;
  role: 'PATIENT' | 'MEDECIN' | 'ADMINISTRATEUR' | 'RECEPTIONNISTE';
  token: string;
  patientId?: number;
  medecinId?: number;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nom: string, prenom: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updatedFields: Partial<User>) => void;
  language: string;
  changeLanguage: (lang: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = 'http://localhost:8081/api/v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('language') || 'fr');

  useEffect(() => {
    const stored = localStorage.getItem('med_appoint_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('med_appoint_user');
      }
    }
    setLoading(false);
  }, []);

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };
      setUser(updatedUser);
      localStorage.setItem('med_appoint_user', JSON.stringify(updatedUser));
    }
  };

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Identifiants de connexion invalides.');
    }

    localStorage.setItem('med_appoint_user', JSON.stringify(data));
    setUser(data);
  };

  const register = async (nom: string, prenom: string, email: string, password: string, role: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, password, role }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l’inscription.');
    }

    localStorage.setItem('med_appoint_user', JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('med_appoint_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        updateUser,
        language,
        changeLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
