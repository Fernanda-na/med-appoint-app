import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../../constants/config';

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(''); // Simple text for demo, would use a picker in production
  const [motif, setMotif] = useState('');

  const handleBook = async () => {
    if (!date) {
      Alert.alert('Erreur', 'Veuillez saisir une date.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          medecinId: parseInt(id as string),
          dateHeureDebut: new Date(date).toISOString(),
          motif: motif
        })
      });

      if (response.ok) {
        Alert.alert('Succès', 'Votre rendez-vous a été enregistré.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Impossible de réserver ce créneau.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Problème de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prendre RDV</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Date et Heure (Format: YYYY-MM-DD HH:mm)</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ex: 2026-04-15 10:30"
            value={date}
            onChangeText={setDate}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Motif de consultation</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder="Ex: Contrôle annuel, douleurs..."
            value={motif}
            onChangeText={setMotif}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity 
          style={styles.bookBtn} 
          onPress={handleBook}
          disabled={loading}
        >
          <LinearGradient colors={['#3498db', '#2980b9']} style={styles.gradient}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookBtnText}>Confirmer le rendez-vous</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: {
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 15,
  },
  content: {
    padding: 25,
  },
  infoBox: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  bookBtn: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradient: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
