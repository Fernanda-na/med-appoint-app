import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL, UPLOADS_BASE_URL } from '../../constants/config';

export default function ProfileScreen() {
  const { user, token, signOut, signIn } = useAuth();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Mettre à jour le contexte global
        if (user) {
          await signIn(token!, { ...user, avatarUrl: data.avatarUrl });
        }
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } else {
        Alert.alert('Erreur', "Échec de l'envoi de l'image.");
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            {user?.avatarUrl ? (
              <Image source={{ uri: `${UPLOADS_BASE_URL}/${user.avatarUrl}` }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholder]}>
                <Text style={styles.placeholderText}>{user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          {uploading && <ActivityIndicator style={styles.loader} color="#3498db" />}
        </View>
        <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="person" size={20} color="#0284c7" />
          </View>
          <Text style={styles.menuText}>Mes informations</Text>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.iconBox, { backgroundColor: '#fef9c3' }]}>
            <Ionicons name="notifications" size={20} color="#a16207" />
          </View>
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="lock-closed" size={20} color="#7e22ce" />
          </View>
          <Text style={styles.menuText}>Sécurité</Text>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
        <Ionicons name="log-out" size={20} color="#ef4444" style={{ marginRight: 10 }} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#f1f5f9',
  },
  placeholder: {
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#3498db',
  },
  editBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#3498db',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  loader: {
    position: 'absolute',
    top: 50,
    left: 50,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 25,
    marginTop: 40,
    marginBottom: 60,
    padding: 18,
    backgroundColor: '#fee2e2',
    borderRadius: 20,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
