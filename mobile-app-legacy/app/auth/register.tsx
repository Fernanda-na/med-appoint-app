import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useRouter, Link } from 'expo-router';
import { API_BASE_URL } from '../../constants/config';

const roles = [
  { value: 'PATIENT', label: 'Patient' },
  { value: 'MEDECIN', label: 'Médecin' },
  { value: 'RECEPTIONNISTE', label: 'Réceptionniste' }
];

export default function RegisterScreen() {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'PATIENT' as const
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        await signIn(data.token, {
          nom: data.nom,
          prenom: data.prenom,
          role: data.role
        });
        router.replace('/(tabs)');
      } else {
        setError(data.message || "Erreur lors de l'inscription.");
      }
    } catch (e) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#2c3e50', '#000000']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logoIcon}>🏥</Text>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez MedAppoint aujourd'hui</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={form.nom}
                  onChangeText={(txt) => setForm({...form, nom: txt})}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={form.prenom}
                  onChangeText={(txt) => setForm({...form, prenom: txt})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={form.email}
                onChangeText={(txt) => setForm({...form, email: txt})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Je suis un...</Text>
              <View style={styles.roleContainer}>
                {roles.map((r) => (
                  <TouchableOpacity 
                    key={r.value}
                    style={[styles.roleButton, form.role === r.value && styles.roleButtonActive]}
                    onPress={() => setForm({...form, role: r.value as any})}
                  >
                    <Text style={[styles.roleButtonText, form.role === r.value && styles.roleButtonTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={form.password}
                onChangeText={(txt) => setForm({...form, password: txt})}
                secureTextEntry
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>S'Inscrire</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Déjà un compte ? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Connectez-vous</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    padding: 30,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  roleButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 40,
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  linkText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: '700',
  },
});
