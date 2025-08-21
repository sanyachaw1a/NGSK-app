import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string;
  image?: any;
}

export default function AboutModal({ visible, onClose, title, content, image }: AboutModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>

          <ScrollView
            style={{ flex: 1 }}                          // <- ensures the body gets space
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
          >
            {image ? <Image source={image} style={styles.avatar} /> : null}
            <Text style={styles.modalText}>{content}</Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* === Styles that match your page cards (peach/orange theme) === */
const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',   // lighter dim so content stays visible
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFF',           // peach wash like your cards
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFD9B3',               // soft peach border
    height: '85%',                         // bound the parent so ScrollView has room
    width: '92%',
    alignSelf: 'center',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  scrollContainer: {
    paddingBottom: 12,
  },
  modalTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '700',
    // fontFamily: 'OpenSans-Bold',        // uncomment if loaded
    color: '#E27528',                      // orange accent to match headers
  },
  modalText: {
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 8,
    fontSize: 15,
    // fontFamily: 'NunitoSans-Regular',   // uncomment if loaded
    color: '#333',
  },
  avatar: {
    width: 250 ,
    height: 250,
    aspectRatio: 1,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 12,
      marginTop: 20,

    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  closeButton: {
    backgroundColor: '#FFE7CC',           // soft pill button
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  closeButtonText: {
    color: '#E27528',
    fontSize: 16,
    fontWeight: '700',
  },
});
