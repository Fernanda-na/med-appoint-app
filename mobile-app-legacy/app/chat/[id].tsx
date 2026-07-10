import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/config';

export default function ChatScreen() {
  const { id } = useLocalSearchParams(); // Email du destinataire (simulé pour l'id)
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/history?currentUser=${user?.email}&withUser=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/send-rest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contenu: newMessage,
          expediteurEmail: user?.email,
          destinataireEmail: id
        })
      });

      if (response.ok) {
        setNewMessage('');
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isSent = item.expediteurEmail === user?.email;
    return (
      <View style={[styles.messageWrapper, isSent ? styles.sentWrapper : styles.receivedWrapper]}>
        <View style={[styles.bubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
          <Text style={[styles.messageText, isSent ? styles.sentText : styles.receivedText]}>
            {item.contenu}
          </Text>
          <Text style={styles.timeText}>
            {new Date(item.dateEnvoi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discussion</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Écrivez un message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!newMessage.trim()}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 15,
  },
  list: {
    padding: 20,
  },
  messageWrapper: {
    marginBottom: 15,
    flexDirection: 'row',
    width: '100%',
  },
  sentWrapper: {
    justifyContent: 'flex-end',
  },
  receivedWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  sentBubble: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#1e293b',
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'right',
  },
  receivedBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  receivedText: {
    color: '#1e293b',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#3498db',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
