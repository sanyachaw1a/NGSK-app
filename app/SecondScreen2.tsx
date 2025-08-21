// SecondScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Pressable,
  ScrollView, Linking, Image, Alert, Platform, useWindowDimensions
} from 'react-native';
import { db } from './firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function SecondScreen() {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();

  const [aboutVisible, setAboutVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [nirmalVisible, setNirmalVisible] = useState(false);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- Carousel state (for Nirmal Ashram modal) ---
  const [carouselW, setCarouselW] = useState(winW); // start with window width
  const [slide, setSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const nirmalImages = [
    require('../assets/images/about-1.jpeg'),
    require('../assets/images/about-2.jpeg'),
    require('../assets/images/about-3.jpeg'),
  ];

  // Auto flip while modal is open
  useEffect(() => {
    if (!nirmalVisible || !carouselW) return;
    const total = nirmalImages.length;
    const id = setInterval(() => {
      setSlide((curr) => {
        const next = (curr + 1) % total;
        scrollRef.current?.scrollTo({ x: next * carouselW, y: 0, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [nirmalVisible, carouselW, nirmalImages.length]);

  const handleLayout = (e: any) => {
    const w = e?.nativeEvent?.layout?.width ?? winW;
    if (!w) return;
    if (w !== carouselW) setCarouselW(w);
    // defer to next tick; prevents “layout of null” if unmounted mid-cycle
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: slide * w, y: 0, animated: false });
    }, 0);
  };

  const handleScroll = (e: any) => {
    const w = carouselW || winW;
    if (!w) return;
    const i = Math.round((e?.nativeEvent?.contentOffset?.x ?? 0) / w);
    setSlide(i);
  };

  const submitContact = async () => {
    const nameTrim = fullName.trim();
    const countryTrim = country.trim();
    const msgTrim = message.trim();
    const whatsappTrim = whatsapp.trim().replace(/[^\d+]/g, '');
    if (!nameTrim || !countryTrim || !whatsappTrim || !msgTrim) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (whatsappTrim.length < 7) {
      Alert.alert('WhatsApp number', 'Please enter a valid WhatsApp number.');
      return;
    }
    try {
      setSubmitting(true);
      await addDoc(collection(db, 'contact_messages'), {
        name: nameTrim, country: countryTrim, whatsapp: whatsappTrim, message: msgTrim,
        createdAt: serverTimestamp(), platform: Platform.OS,
      });
      Alert.alert('Thank you', 'Your message has been sent.');
      setContactVisible(false); setFullName(''); setCountry(''); setWhatsapp(''); setMessage('');
    } catch {
      Alert.alert('Error', 'Could not send your message. Please try again.');
    } finally { setSubmitting(false); }
  };

  const playlists = [
    { title: 'NGSK Study Material', url: 'https://drive.google.com/drive/folders/1kHpvzO6TKFwtGhYb4ZULz_BYo_GHtm42?usp=drive_link', thumbnail: require('../assets/images/study-material.jpg') },
    { title: 'Learn Gurmukhi Series', url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNicZKh7_RnugSKLuSXz2x9A', thumbnail: require('../assets/images/learn-gurumukhi.jpg') },
    { title: 'Learn Gurbani Series', url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNh1KZlJvN3FF2aOqcQ5Fioq', thumbnail: require('../assets/images/learn-gurbani.jpg') },
    { title: 'NGSK Events & Celebrations', url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNiN6PO-W5kNV1aGWz3PM3MM', thumbnail: require('../assets/images/ngsk-events.jpg') },
    { title: 'Chronicles of Grace & Selfless Service', url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNh4z8FaKEp-ijx9ZvUQH1Ve', thumbnail: require('../assets/images/chronicles-of-grace.jpg') },
    { title: 'Explore our YouTube Channel', url: 'https://www.youtube.com/@Insahaj', thumbnail: require('../assets/images/explore-youtube.jpg') },
  ];

  const openLink = async (url: string) => {
    try { const supported = await Linking.canOpenURL(url); if (supported) await Linking.openURL(url); } catch {}
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top','left','right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
        {/* Top CTA cards */}
        <View style={styles.topCards}>
          <TouchableOpacity style={styles.card} onPress={() => setAboutVisible(true)} activeOpacity={0.85}>
            <Text style={styles.cardText}>About NGSK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => setContactVisible(true)} activeOpacity={0.85}>
            <Text style={styles.cardText}>Get in Touch</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.list}>
          {playlists.map((p, i) => (
            <TouchableOpacity key={i} style={styles.listItem} onPress={() => openLink(p.url)} activeOpacity={0.9}>
              <Image source={p.thumbnail} style={styles.thumbSmall} />
              <View style={styles.listTextWrap}>
                <Text style={styles.listTitle}>{p.title}</Text>
                <Text style={styles.listHint} accessible={false}>Tap to open</Text>
              </View>
              <Text style={styles.chev} allowFontScaling={false}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nirmal Ashram CTA */}
        <TouchableOpacity style={[styles.card, styles.fullWidthCard]} onPress={() => setNirmalVisible(true)} activeOpacity={0.85}>
          <Text style={styles.cardText}>About Nirmal Ashram Rishikesh</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Nirmal Ashram Modal with auto-flip carousel */}
      <Modal visible={nirmalVisible} transparent animationType="slide" onRequestClose={() => setNirmalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>About Nirmal Ashram Rishikesh</Text>

            <View style={styles.modalBodyWrap}>
              <ScrollView contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator>
                {/* Carousel */}
                <View style={styles.carouselWrap} onLayout={handleLayout}>
                  <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                  >
                    {nirmalImages.map((src, idx) => (
                      <Image key={idx} source={src} style={[styles.carouselImage, { width: carouselW }]} resizeMode="cover" />
                    ))}
                  </ScrollView>
                  <View style={styles.dots}>
                    {nirmalImages.map((_, i) => (
                      <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
                    ))}
                  </View>
                </View>

                {/* Text */}
                <Text style={styles.modalBody}>
                  <Text style={{ fontWeight: '700' }}>*About Nirmal Ashram Rishikesh*</Text>
                  {'\n'}
                  Nirmal Ashram is an ancient hermitage that embodies the spirit of selfless service and spiritual learning…
                  {'\n\n'}
                  He was succeeded by Sant Atma Singh Ji Maharaj and later by Mahant Baba Narain Singh Ji Maharaj…
                  {'\n\n'}
                  A towering light in this lineage is Sant Baba Nikka Singh Ji Maharaj ‘Virakat’…
                  {'\n\n'}
                  Today, the legacy continues under the divine guidance of his shishya, Brahmgyani Mahant Baba Ram Singh Ji Maharaj…
                  {'\n\n'}
                  With gratitude, we honour all the Saints of Nirmal Ashram.
                </Text>
              </ScrollView>
            </View>

            <Pressable style={styles.closeButton} onPress={() => setNirmalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ===== Styles ===== */
const GREEN = '#B4BE76';
const GREEN_DEEP = '#5F7D3C';
const GREEN_SOFT = '#DCE6C8';
const BG_WASH = '#F7FAF2';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: 30, paddingBottom: 28 },

  topCards: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 20 },
  card: {
    backgroundColor: BG_WASH, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 12,
    minHeight: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GREEN_SOFT,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, width: '48%',
  },
  fullWidthCard: { width: '100%', marginTop: 12, minHeight: 60 },
  cardText: { fontSize: 15, fontWeight: '600', color: GREEN, textAlign: 'center', flexShrink: 1 },

  sectionTitle: { marginTop: 6, fontSize: 18, fontWeight: '700', color: GREEN, marginBottom: 10, textAlign: 'left', paddingHorizontal: 2 },

  list: { gap: 10, marginBottom: 16 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BG_WASH, borderRadius: 14, paddingVertical: 12,
    paddingHorizontal: 12, minHeight: 68, borderWidth: 1, borderColor: GREEN_SOFT, shadowColor: '#000',
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  thumbSmall: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#EEE', marginRight: 10 },
  listTextWrap: { flex: 1, paddingRight: 8 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#2E2C2B', lineHeight: 20, flexShrink: 1 },
  listHint: { fontSize: 12, color: '#7A8460', marginTop: 2 },
  chev: { fontSize: 24, color: GREEN, marginLeft: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: GREEN_SOFT,
    height: '85%', width: '92%', alignSelf: 'center', flexDirection: 'column',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: GREEN, marginBottom: 10 },
  modalBodyWrap: { flex: 1, minHeight: 0, marginTop: 6, marginBottom: 12 },
  modalBodyContent: { paddingBottom: 8, flexGrow: 1 },
  modalBody: { fontSize: 15, color: '#363A2B', lineHeight: 22 },

  input: {
    borderWidth: 1, borderColor: GREEN_SOFT, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
    marginTop: 10, backgroundColor: BG_WASH, color: '#2A2A2A', minHeight: 48,
  },
  inputMultiline: { minHeight: 110 },
  submitButton: { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, minHeight: 52, justifyContent: 'center' },
  submitButtonText: { color: '#FDFAF5', fontWeight: '700', fontSize: 15 },
  closeButton: { backgroundColor: '#EAF3DC', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10, minHeight: 48, justifyContent: 'center' },
  closeButtonText: { color: GREEN_DEEP, fontWeight: '700', fontSize: 14 },
  websiteButton: { backgroundColor: '#EAF3DC', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  websiteButtonText: { color: GREEN_DEEP, fontSize: 16, fontWeight: '600' },

  stanza: { marginBottom: 14 },
  gurmukhiLine: { fontSize: 18, lineHeight: 28, color: '#2E2C2B' },
  devanagariLine: { fontSize: 16, lineHeight: 26, color: '#2E2C2B' },
  translitLine: { fontSize: 15, lineHeight: 22, color: '#3C3F44', fontStyle: 'italic', marginTop: 2 },
  citation: { fontSize: 12, color: '#7A8460', marginTop: 6 },

  h2: { fontSize: 18, fontWeight: '700', color: '#2E2C2B', marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 16, fontWeight: '700', color: '#2E2C2B', marginTop: 12, marginBottom: 6 },
  p: { fontSize: 15, lineHeight: 22, color: '#363A2B', marginBottom: 8 },

  // Carousel
  carouselWrap: { width: '100%', alignSelf: 'center', marginBottom: 12 },
  carouselImage: { height: 220, borderRadius: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.15)' },
  dotActive: { backgroundColor: '#7AA657' },
});
