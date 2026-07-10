import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#3498db', '#2980b9']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Aperçu rapide</Text>
        
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardIcon}>📅</Text>
            <Text style={styles.cardInfo}>Prochain RDV</Text>
            <Text style={styles.cardValue}>Demain, 10:30</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardIcon}>💊</Text>
            <Text style={styles.cardInfo}>Ordonnances</Text>
            <Text style={styles.cardValue}>3 actives</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>Trouver un praticien</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📄</Text>
          <Text style={styles.actionText}>Historique médical</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={signOut} style={[styles.actionButton, { marginTop: 40, backgroundColor: '#fee2e2' }]}>
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionText, { color: '#991b1b' }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    gap: 15,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  cardInfo: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
});
