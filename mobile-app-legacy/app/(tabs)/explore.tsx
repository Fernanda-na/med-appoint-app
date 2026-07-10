import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants/config';

export interface Doctor {
  id: number;
  nom: string;
  prenom: string;
  lieuConsultation: string;
  specialite?: {
    id: number;
    nom: string;
  };
}

export default function ExploreScreen() {
  const { token } = useAuth();
  const router = useRouter();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (specialty = '') => {
    setLoading(true);
    try {
      const url = specialty 
        ? `${API_BASE_URL}/doctors?specialty=${specialty}` 
        : `${API_BASE_URL}/doctors`;
        
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDoctors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/booking/${item.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.prenom.charAt(0)}{item.nom.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>Dr. {item.prenom} {item.nom}</Text>
        <Text style={styles.specialty}>{item.specialite?.nom || 'Généraliste'}</Text>
        <Text style={styles.location}>📍 {item.lieuConsultation}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput 
            style={styles.input}
            placeholder="Rechercher un médecin..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchDoctors(searchQuery)}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun résultat trouvé.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    backgroundColor: '#e0f2fe',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#3498db',
    fontSize: 18,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  specialty: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '600',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#64748b',
    fontSize: 16,
  },
});
