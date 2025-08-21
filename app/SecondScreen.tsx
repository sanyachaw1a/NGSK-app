// SecondScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Linking,
  Image,
  Alert,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';

import { db } from './firebaseConfig'; // <- make sure this file exports `db`
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

  // ---- Carousel state (Nirmal Ashram modal) ----
  const scrollRef = useRef<ScrollView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nirmalImages = [
    require('../assets/images/about-1.jpeg'),
    require('../assets/images/about-2.jpeg'),
    require('../assets/images/about-3.jpeg'),
  ];

  // Keep aspect ratio dynamically based on the first image
  const [imgAR, setImgAR] = useState(220 / 320); // fallback AR (height/width)
  const [wrapW, setWrapW] = useState(0);         // width available inside modal
  const [slide, setSlide] = useState(0);

  // Compute display size: scale to container width with gentle clamps
  const displayW = Math.max(260, Math.min(wrapW || winW, 520));
  const displayH = Math.round(displayW * imgAR);

  // Detect the real aspect ratio of the first local image (once)
  useEffect(() => {
    const { width, height } = Image.resolveAssetSource(nirmalImages[0]);
    if (width && height) setImgAR(height / width);
  }, []);

  // Auto-flip only while modal is visible
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!nirmalVisible || !displayW) return;

    intervalRef.current = setInterval(() => {
      setSlide((curr) => {
        const next = (curr + 1) % nirmalImages.length;
        scrollRef.current?.scrollTo({ x: next * displayW, y: 0, animated: true });
        return next;
      });
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [nirmalVisible, displayW]);

  const onCarouselLayout = (e: LayoutChangeEvent) => {
    const w = e?.nativeEvent?.layout?.width || winW || 0;
    if (!w) return;
    if (w !== wrapW) setWrapW(w);
    // keep current slide in view after size changes
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: slide * displayW, y: 0, animated: false });
    });
  };

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset?.x ?? 0;
    const i = Math.round(x / Math.max(1, displayW));
    if (i !== slide) setSlide(i);
  };

  // ---- Contact submit ----
  const submitContact = async () => {
    const nameTrim = fullName.trim();
    const countryTrim = country.trim();
    const msgTrim = message.trim();
    const whatsappTrim = whatsapp.trim().replace(/[^\d+]/g, ''); // keep digits and '+'

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
        name: nameTrim,
        country: countryTrim,
        whatsapp: whatsappTrim,
        message: msgTrim,
        createdAt: serverTimestamp(),
        platform: Platform.OS,
      });

      Alert.alert('Thank you', 'Your message has been sent.');
      setContactVisible(false);
      setFullName('');
      setCountry('');
      setWhatsapp('');
      setMessage('');
    } catch (err) {
      Alert.alert('Error', 'Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Quick links (remote thumbnails, like your old file) ----
  const playlists = [
    {
      title: 'NGSK Study Material',
      url: 'https://drive.google.com/drive/folders/1kHpvzO6TKFwtGhYb4ZULz_BYo_GHtm42?usp=drive_link',
      thumbnail: require('../assets/images/study-material.jpg'),
    },
    {
      title: 'Learn Gurmukhi Series',
      url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNicZKh7_RnugSKLuSXz2x9A',
      thumbnail: require('../assets/images/learn-gurumukhi.jpg'),
    },
    {
      title: 'Learn Gurbani Series',
      url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNh1KZlJvN3FF2aOqcQ5Fioq',
      thumbnail: require('../assets/images/learn-gurbani.jpg'),
    },
    {
      title: 'NGSK Events & Celebrations',
      url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNiN6PO-W5kNV1aGWz3PM3MM',
      thumbnail: require('../assets/images/ngsk-events.jpg'),
    },
    {
      title: 'Chronicles of Grace & Selfless Service',
      url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNh4z8FaKEp-ijx9ZvUQH1Ve',
      thumbnail: require('../assets/images/chronicles-of-grace.jpg'),
    },
    {
      title: 'Explore our YouTube Channel',
      url: 'https://www.youtube.com/@Insahaj',
      thumbnail: require('../assets/images/explore-youtube.jpg'),
    },
  ];

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      // noop
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { paddingTop: insets.top }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {/* About NGSK & Get in Touch (from old file) */}
        <View style={styles.topCards}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setAboutVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.cardText} maxFontSizeMultiplier={2.2}>
              About NGSK
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => setContactVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.cardText} maxFontSizeMultiplier={2.2}>
              Get in Touch
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={2.4}>
          Quick Links
        </Text>

        <View style={styles.list}>
          {playlists.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.listItem}
              onPress={() => openLink(p.url)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`Open ${p.title}`}
            >
              <Image source={p.thumbnail} style={styles.thumbSmall} />
              <View style={styles.listTextWrap}>
                <Text style={styles.listTitle} maxFontSizeMultiplier={2.4}>
                  {p.title}
                </Text>
                <Text style={styles.listHint} maxFontSizeMultiplier={1.6} accessible={false}>
                  Tap to open
                </Text>
              </View>
              <Text style={styles.chev} allowFontScaling={false}>
                ›
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About Nirmal Ashram Rishikesh CTA */}
        <TouchableOpacity
          style={[styles.card, styles.fullWidthCard]}
          onPress={() => setNirmalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.cardText} maxFontSizeMultiplier={2.2}>
            About Nirmal Ashram Rishikesh
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* About NGSK Modal (unchanged content from old file) */}
      <Modal
        visible={aboutVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle} maxFontSizeMultiplier={2.2}>
              About NGSK
            </Text>

            <View style={styles.modalBodyWrap}>
              <ScrollView
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator
              >
                <Image source={require('../assets/images/icon.png')} style={styles.logo} />

                <Text style={styles.h2} maxFontSizeMultiplier={2.2}>
                  About NGSK, Rishikesh
                </Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  Nirmal Ashram Gurbani Shiksha Kendra, Rishikesh (NGSK) is an online sewa initiative
                  founded on 3rd September 2020, by and with the divine blessings and infinite grace
                  of our beloved Gurudev, Brahmgyani Mahant Baba Ram Singh Ji Maharaj, Spiritual Head
                  of Nirmal Ashram Rishikesh and Sant Baba Jodh Singh Ji Maharaj.
                </Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  Rooted in nishkam sewa (selfless service) and simran (constant remembrance of the One
                  Lord), NGSK Rishikesh was born from Maharaj Ji's boundless compassion for humanity — to
                  uplift and connect sincere seekers with the sacred vibrations of Gurbani.
                </Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  Gurbani is a priceless treasure — the sacred medium through which the Lord's Word was
                  spoken, recorded, and revealed in the form of Sri Guru Granth Sahib Ji. It is a timeless,
                  universal guide for all spiritual seekers, pointing inward to the hidden gem of the self
                  within us all — the ever shining, effulgent soul.
                </Text>

                <Text style={styles.h3} maxFontSizeMultiplier={2.1}>
                  Vision
                </Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  To awaken all hearts to the light of the One Lord that shines within us all, through the
                  sacred medium of Gurbani.
                </Text>

                <Text style={styles.h3} maxFontSizeMultiplier={2.1}>
                  Mission
                </Text>
                <View style={styles.ul}>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bullet} allowFontScaling={false}>•</Text>
                    <Text style={styles.bulletText} maxFontSizeMultiplier={2.0}>
                      To honour Gurbani with the reverence and love it truly deserves.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bullet} allowFontScaling={false}>•</Text>
                    <Text style={styles.bulletText} maxFontSizeMultiplier={2.0}>
                      To offer selfless service and heartfelt guidance in the sacred journey of reading Gurbani
                      correctly — with devotion, clarity, and care.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bullet} allowFontScaling={false}>•</Text>
                    <Text style={styles.bulletText} maxFontSizeMultiplier={2.0}>
                      To help seekers turn inward — disconnecting from the fleeting world, and connecting with the
                      eternal self through the light of Gurbani.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bullet} allowFontScaling={false}>•</Text>
                    <Text style={styles.bulletText} maxFontSizeMultiplier={2.0}>
                      To gently remind ourselves of the true purpose of this rare and precious human birth:
                      self-realisation — union with the Divine.
                    </Text>
                  </View>
                </View>

                <Text style={styles.h3} maxFontSizeMultiplier={2.1}>
                  What we teach
                </Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  Through online classes, NGSK supports learners in learning the Gurmukhi Script as well as reading
                  Gurbani correctly in Gurmukhi, Hindi and English, with focus on:
                </Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>- Shudh Uchaaran (correct pronunciation)</Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>- Vishraams (intended pauses)</Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>- Bhavnaa (devotion and sincerity)</Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  Our youngest students are just 4 years old, and our eldest learners are in their 90s.
                </Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  As of 2025, over 1300 seekers from 23 countries have joined this sacred journey, guided by the
                  nishkam sewa of more than 100 devoted teachers from around the world — all made possible only
                  through the infinite grace and mercy of our beloved Gurudev, Brahmgyani Mahant Baba Ram Singh Ji
                  Maharaj.
                </Text>

                <Text style={styles.h3} maxFontSizeMultiplier={2.1}>
                  A Humble Prayer
                </Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  May we not just read Gurbani, but live it. May its divine flame, kindled by Maharaj Ji’s grace and
                  love, illuminate our hearts — and the hearts of generations to come. May this life be used in its
                  highest service: to walk the path of Truth, and merge into the One Light.
                </Text>
              </ScrollView>
            </View>

            <Pressable
              style={styles.websiteButton}
              onPress={() => Linking.openURL('https://ngsk.info')}
            >
              <Text style={styles.websiteButtonText} maxFontSizeMultiplier={1.8}>
                Visit our website
              </Text>
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setAboutVisible(false)}>
              <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.8}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Contact Modal (from old file) */}
      <Modal
        visible={contactVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View className="card" style={styles.modalCard}>
            <Text style={styles.modalTitle} maxFontSizeMultiplier={2.2}>
              Get in Touch
            </Text>

            <TextInput
              placeholder="Full name"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              placeholderTextColor="#8FA169"
              maxFontSizeMultiplier={1.6}
            />

            <TextInput
              placeholder="Country"
              value={country}
              onChangeText={setCountry}
              style={styles.input}
              placeholderTextColor="#8FA169"
              maxFontSizeMultiplier={1.6}
            />

            <TextInput
              placeholder="WhatsApp number"
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#8FA169"
              maxFontSizeMultiplier={1.6}
            />

            <TextInput
              placeholder="Message"
              value={message}
              onChangeText={setMessage}
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#8FA169"
              maxFontSizeMultiplier={1.6}
            />

            <Pressable
              style={[styles.submitButton, submitting && { opacity: 0.6 }]}
              onPress={submitContact}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText} allowFontScaling maxFontSizeMultiplier={2}>
                {submitting ? 'Sending…' : 'Send'}
              </Text>
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setContactVisible(false)}>
              <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.8}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Nirmal Ashram Modal with responsive, ratio-locked carousel */}
      <Modal
        visible={nirmalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNirmalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle} maxFontSizeMultiplier={2.2}>
              About Nirmal Ashram Rishikesh
            </Text>

            <View style={styles.modalBodyWrap}>
              <ScrollView
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator
              >
                {/* Carousel */}
                <View style={[styles.carouselWrap, { height: displayH }]} onLayout={onCarouselLayout}>
                  <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    onScroll={onCarouselScroll}
                  >
                    {nirmalImages.map((src, idx) => (
                      <Image
                        key={idx}
                        source={src}
                        style={[styles.carouselImage, { width: displayW, height: displayH }]}
                        resizeMode="contain" // shows full image without cropping
                      />
                    ))}
                  </ScrollView>
                  <View style={styles.dots}>
                    {nirmalImages.map((_, i) => (
                      <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
                    ))}
                  </View>
                </View>

                {/* Body text */}
                <Text style={styles.modalBody} maxFontSizeMultiplier={2.2}>
                  <Text style={{ fontWeight: '700' }}>About Nirmal Ashram Rishikesh</Text>
                  {'\n'}
                  Nirmal Ashram is an ancient hermitage that embodies the spirit of selfless service
                  and spiritual learning. Nestled on the banks of the sacred Ganga in the Himalayan
                  town of Rishikesh, it was established in 1903 by Mahant Baba Buddha Singh Ji
                  Maharaj, whose life was devoted to spreading the teachings of Guru Nanak Dev Ji —
                  to see the Divine in all and to Love All, Serve All.
                  {'\n\n'}
                  He was succeeded by Sant Atma Singh Ji Maharaj and later by Mahant Baba Narain
                  Singh Ji Maharaj, both of whom upheld and expanded the Ashram’s mission.
                  {'\n\n'}
                  A towering light in this lineage is Sant Baba Nikka Singh Ji Maharaj ‘Virakat’, a
                  direct disciple of Baba Buddha Singh Ji, who through his tireless travels and
                  spiritual outreach shared the message of Gurbani (Word of the Guru), sewa (selfless
                  service), and simran (remembrance of the Lord) across North India.
                  {'\n\n'}
                  Today, the legacy continues under the divine guidance of his shishya, Brahmgyani
                  Mahant Baba Ram Singh Ji Maharaj, supported by Sant Jodh Singh Ji Maharaj, whose
                  lives radiate love, humility, and unwavering service. We bow in deep reverence to
                  Sarpanch Maharaj Ji, Sant Bharat Ji, and Sant Kanwal Ji — devoted instruments of
                  Gurudev’s divine mission.
                  {'\n\n'}
                  With gratitude, we honour all the Saints of Nirmal Ashram.
                </Text>
              </ScrollView>
            </View>

            <Pressable style={styles.closeButton} onPress={() => setNirmalVisible(false)}>
              <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.8}>
                Close
              </Text>
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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: 30, paddingBottom: 28 },

  /* Top buttons */
  topCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  card: {
    backgroundColor: BG_WASH,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GREEN_SOFT,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    width: '48%',
  },
  fullWidthCard: { width: '100%', marginTop: 12, minHeight: 60 },
  cardText: {
    fontSize: 15,
    fontWeight: '600',
    color: GREEN,
    textAlign: 'center',
    flexShrink: 1,
  },

  /* Quick Links (list) */
  sectionTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 10,
    textAlign: 'left',
    paddingHorizontal: 2,
  },
  logo: {
    width: 300,
    height: 300,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 16,
  },
  list: { gap: 10, marginBottom: 16 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_WASH,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 68,
    borderWidth: 1,
    borderColor: GREEN_SOFT,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  thumbSmall: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#EEE',
    marginRight: 10,
  },
  listTextWrap: { flex: 1, paddingRight: 8 },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E2C2B',
    lineHeight: 20,
    flexShrink: 1,
  },
  listHint: { fontSize: 12, color: '#7A8460', marginTop: 2 },
  chev: { fontSize: 24, color: GREEN, marginLeft: 8 },

  /* Modals & inputs */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    padding: 20,
  },
  ul: {
    marginVertical: 10,
    paddingLeft: 20, // space for bullets
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333', // dark bullet dot
    marginTop: 9,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: GREEN_SOFT,
    height: '85%', // fixed height to keep layout stable
    width: '92%',
    alignSelf: 'center',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 10,
  },

  // wrapper controls height
  modalBodyWrap: {
    flex: 1,
    minHeight: 0,
    marginTop: 6,
    marginBottom: 12,
  },
  // content grows; prevents ScrollView from collapsing
  modalBodyContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  modalBody: {
    fontSize: 15,
    color: '#363A2B',
    lineHeight: 22,
  },

  input: {
    borderWidth: 1,
    borderColor: GREEN_SOFT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: BG_WASH,
    color: '#2A2A2A',
    minHeight: 48,
  },
  inputMultiline: { minHeight: 110 },

  submitButton: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  submitButtonText: { color: '#FDFAF5', fontWeight: '700', fontSize: 15 },

  closeButton: {
    backgroundColor: '#EAF3DC',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  closeButtonText: { color: GREEN_DEEP, fontWeight: '700', fontSize: 14 },
  websiteButton: {
    backgroundColor: '#EAF3DC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  websiteButtonText: {
    color: GREEN_DEEP,
    fontSize: 16,
    fontWeight: '600',
  },

  // formatted content styles
  stanza: { marginBottom: 14 },
  gurmukhiLine: { fontSize: 18, lineHeight: 28, color: '#2E2C2B' },
  devanagariLine: { fontSize: 16, lineHeight: 26, color: '#2E2C2B' },
  translitLine: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3C3F44',
    fontStyle: 'italic',
    marginTop: 2,
  },
  citation: { fontSize: 12, color: '#7A8460', marginTop: 6 },

  h2: { fontSize: 18, fontWeight: '700', color: '#2E2C2B', marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 16, fontWeight: '700', color: '#2E2C2B', marginTop: 12, marginBottom: 6 },
  p: { fontSize: 15, lineHeight: 22, color: '#363A2B', marginBottom: 8 },

  // --- Carousel styles ---
  carouselWrap: { width: '100%', alignSelf: 'center', marginBottom: 12 },
  carouselImage: { borderRadius: 12 }, // width/height set inline per computed displayW/H
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.15)' },
  dotActive: { backgroundColor: '#7AA657' },
});
