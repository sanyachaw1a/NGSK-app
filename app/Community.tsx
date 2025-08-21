import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { db } from './firebaseConfig';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

export default function CommunityForum() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'community_messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        timestamp: doc.data().timestamp?.toDate()
      })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Community Forum</Text>

      <ScrollView style={styles.messages}>
        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageCard}>
            <Text style={styles.messageText}>{msg.text}</Text>
            {msg.timestamp && (
              <Text style={styles.timestampText}>
                Time: {msg.timestamp.toLocaleString()}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF5', // Bianca
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2E2C2B', // Birch
    fontFamily: 'OpenSans-Bold',
    paddingTop: 20,
  },
  messages: {
    flex: 1,
  },
  messageCard: {
    backgroundColor: '#FFF5EC', // light Bianca
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#4F2613', // Cork
    fontWeight: '500',
    fontFamily: 'NunitoSans-Regular',
    marginBottom: 6,
  },
  timestampText: {
    fontSize: 12,
    color: '#777',
    fontFamily: 'NunitoSans-Regular',
  },
});
