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
  Image,
  Alert,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';

import { db } from './firebaseConfig'; // <- make sure this file exports `db`
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Linking } from 'react-native';  // <-- use RN Linking


// at the top with other imports
import * as WebBrowser from 'expo-web-browser';

// Robust YouTube opener
async function openYouTubeLink(opts: {
  videoId?: string;
  playlistId?: string;
  channelId?: string;
  url?: string; // full youtube url
}) {
  let webUrl = opts.url;
  if (!webUrl) {
    if (opts.videoId) webUrl = `https://www.youtube.com/watch?v=${opts.videoId}`;
    else if (opts.playlistId) webUrl = `https://www.youtube.com/playlist?list=${opts.playlistId}`;
    else if (opts.channelId) webUrl = `https://www.youtube.com/channel/${opts.channelId}`;
  }

  const appUrl =
    opts.videoId
      ? `vnd.youtube:${opts.videoId}`
      : opts.playlistId
      ? `vnd.youtube://playlist?list=${opts.playlistId}`
      : opts.channelId
      ? `vnd.youtube://channel/${opts.channelId}`
      : undefined;

  // Try YouTube app directly (no canOpenURL — Android 11+ package visibility!)
  try {
    if (appUrl) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {
    // fall through to web
  }

  // Strongest web fallback: in-app browser first
  if (webUrl) {
    try {
      await WebBrowser.openBrowserAsync(webUrl);
      return;
    } catch {
      // last resort: system handler
      try { await Linking.openURL(webUrl); } catch {}
    }
  }
}

async function openUrlNormalized(url: string) {
  const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    await WebBrowser.openBrowserAsync(finalUrl); // prefer in-app browser for reliability
  } catch {
    try { await Linking.openURL(finalUrl); } catch {}
  }
}

function openSmartUrl(url: string) {
  if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url)) {
    const mVid = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&/]+)/);
    const mList = url.match(/[?&]list=([^&]+)/);
    if (mVid?.[1]) return openYouTubeLink({ videoId: decodeURIComponent(mVid[1]) });
    if (mList?.[1]) return openYouTubeLink({ playlistId: decodeURIComponent(mList[1]) });
    return openYouTubeLink({ url });
  }
  return openUrlNormalized(url);
}


export default function SecondScreen() {
  const insets = useSafeAreaInsets();

  const [aboutVisible, setAboutVisible] = useState(false);     // About NGSK
  const [contactVisible, setContactVisible] = useState(false); // Get in Touch
  const [gurudevVisible, setGurudevVisible] = useState(false); // About Gurudev (two-page modal)

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ---------- Gurudev pager state ----------
  const pagerRef = useRef<ScrollView>(null);
  const [pagerW, setPagerW] = useState(0);
  const [imgH, setImgH] = useState(200);
  const [page, setPage] = useState(0);

  const onPagerLayout = (e: LayoutChangeEvent) => {
    const w = e?.nativeEvent?.layout?.width ?? 0;
    if (!w) return;
    if (w !== pagerW) {
      setPagerW(w);
      setImgH(Math.min(Math.round((w * 9) / 16), 280)); // 16:9, max 280px tall
      requestAnimationFrame(() => pagerRef.current?.scrollTo({ x: page * w, y: 0, animated: false }));
    }
  };

  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset?.x ?? 0;
    const i = Math.round(x / Math.max(1, pagerW));
    if (i !== page) setPage(i);
  };

  const gurudevPages = [
    {
      image: require('../assets/images/maharaj-ji.jpg'),
      title: 'About Gurudev Maharaj Ji',
      body: `Brahmgyani Mahant Baba Ram Singh Ji Maharaj is the Current Spiritual Head of Nirmal Ashram, Rishikesh—a spiritual sanctuary that welcomes all seekers and embodies the principle of ‘Love All, Serve All’. 
      
Maharaj Ji imparts the fundamental truth - there is One God. 

At the heart of Maharaj Ji's teachings lies an emphasis on prema bhakti—wholehearted, sincere love for God, alongside the principles of nishkam sewa—selfless service and naam simran—constant meditative remembrance of the Lord. 

His teachings inspire us to serve everyone, embracing oneness and compassion as guiding principles on the path towards spiritual growth and the ultimate goal of human life: enlightenment, recognising oneself as the witness self, and thus finding liberation from the cycle of birth and death (moksha). 

Maharaj Ji embraces all beings as manifestations of the One Lord, recognising the divine presence within each individual. 

His eyes and entire being radiate love. Mercy is his very nature, and his heart brims with boundless compassion for all beings. 

To contemplate, meditate upon, and receive the blessings of such a saint is to invite purity, inspiration, and divine consciousness into one's life. 

ਐਸਾ ਗੁਰੁ ਵਡਭਾਗੀ ਪਾਇਆ ॥੧॥ ऐसा गुरु वडभागी पाइआ ॥१॥ 
Aesaa gur vadbhaagee paayaa. ||1|| 
Such a Guru is found by great good fortune. ||1|| 
Sri Guru Granth Sahib Ji, Ang 803 (Guru Arjan Dev Ji in Raag Bilawal)`,
    },
    {
      // Swap this image to another file when available, e.g. '../assets/images/maharaj-ji-2.jpg'
      image: require('../assets/images/jodh-maharaj-ji.jpg'),
      title: 'Sant Baba Jodh Singh Ji Maharaj',
      body: `Sant Baba Jodh Singh Ji Maharaj is an embodiment of selfless and devoted service to the Guru and God. With the blessings of His Holiness Mahant Baba Ram Singh Ji Maharaj, his tireless dedication, meticulous care, and unwavering commitment to sewa have given rise to numerous philanthropic institutions affiliated with Nirmal Ashram, as well as the growth of Nirmal Kutias across North India. Through his guidance, he continues to nurture the Ashram’s spiritual mission and keep alive its vision of love, humility, and service.`,
    },
  ];

  const totalPages = gurudevPages.length;

  const goPrevPage = () => {
    if (!pagerW) return;
    const prev = Math.max(0, page - 1);
    pagerRef.current?.scrollTo({ x: prev * pagerW, y: 0, animated: true });
  };

  const goNextPage = () => {
    if (!pagerW) return;
    const next = Math.min(totalPages - 1, page + 1);
    pagerRef.current?.scrollTo({ x: next * pagerW, y: 0, animated: true });
  };

  // Reset to page 0 whenever the modal opens
  useEffect(() => {
    if (gurudevVisible) {
      setPage(0);
      requestAnimationFrame(() => pagerRef.current?.scrollTo({ x: 0, y: 0, animated: false }));
    }
  }, [gurudevVisible, pagerW]);

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

  // ---- Quick links ----
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
    } catch {/* noop */}
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {/* Top buttons */}
        <View style={styles.topCards}>
          <TouchableOpacity style={styles.card} onPress={() => setAboutVisible(true)} activeOpacity={0.85}>
            <Text style={styles.cardText} maxFontSizeMultiplier={2.2}>About NGSK</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => setContactVisible(true)} activeOpacity={0.85}>
            <Text style={styles.cardText} maxFontSizeMultiplier={2.2}>Get in Touch</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={2.4}>Quick Links</Text>
        <View style={styles.list}>
          {playlists.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.listItem}
              onPress={() => openSmartUrl(p.url)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`Open ${p.title}`}
            >
              <Image source={p.thumbnail} style={styles.thumbSmall} />
              <View style={styles.listTextWrap}>
                <Text style={styles.listTitle} maxFontSizeMultiplier={2.4}>{p.title}</Text>
                <Text style={styles.listHint} maxFontSizeMultiplier={1.6} accessible={false}>Tap to open</Text>
              </View>
              <Text style={styles.chev} allowFontScaling={false}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About Gurudev Maharaj Ji CTA */}
        <TouchableOpacity
          style={[styles.card, styles.fullWidthCard]}
          onPress={() => setGurudevVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.cardText} maxFontSizeMultiplier={2.2}>
            About Gurudev Maharaj Ji
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* About NGSK Modal */}
      <Modal visible={aboutVisible} transparent animationType="slide" onRequestClose={() => setAboutVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle} maxFontSizeMultiplier={2.2}>About NGSK</Text>

            <View style={styles.modalBodyWrap}>
              <ScrollView contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator>
                <Image source={require('../assets/images/icon.png')} style={styles.logo} />
                <Text style={styles.h2} maxFontSizeMultiplier={2.2}>About NGSK, Rishikesh</Text>
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

                <Text style={styles.h3} maxFontSizeMultiplier={2.1}>Vision</Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  To awaken all hearts to the light of the One Lord that shines within us all, through the
                  sacred medium of Gurbani.
                </Text>

                <Text style={styles.h3} maxFontSizeMultiplier={2.1}>Mission</Text>
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

                <Text style={styles.h3} maxFontSizeMultiplier={2.1}>What we teach</Text>
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

                <Text style={styles.h3} maxFontSizeMultiplier={2.1}>A Humble Prayer</Text>
                <Text style={styles.p} maxFontSizeMultiplier={2.0}>
                  May we not just read Gurbani, but live it. May its divine flame, kindled by Maharaj Ji’s grace and
                  love, illuminate our hearts — and the hearts of generations to come. May this life be used in its
                  highest service: to walk the path of Truth, and merge into the One Light.
                </Text>
              </ScrollView>
            </View>

            <Pressable style={styles.websiteButton} onPress={() => Linking.openURL('https://ngsk.info')}>
              <Text style={styles.websiteButtonText} maxFontSizeMultiplier={1.8}>Visit our website</Text>
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setAboutVisible(false)}>
              <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.8}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Contact Modal */}
      <Modal visible={contactVisible} transparent animationType="slide" onRequestClose={() => setContactVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle} maxFontSizeMultiplier={2.2}>Get in Touch</Text>

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

            <Pressable style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={submitContact} disabled={submitting}>
              <Text style={styles.submitButtonText} allowFontScaling maxFontSizeMultiplier={2}>
                {submitting ? 'Sending…' : 'Send'}
              </Text>
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setContactVisible(false)}>
              <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.8}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Gurudev Maharaj Ji: TWO-PAGE MODAL (with explicit paging UI) */}
      <Modal visible={gurudevVisible} transparent animationType="slide" onRequestClose={() => setGurudevVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle} maxFontSizeMultiplier={2.2}>About Gurudev Maharaj Ji</Text>

            <View style={styles.modalBodyWrap}>
              <ScrollView contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator>
                {/* Top bar: Prev / Page counter / Next */}
                <View style={styles.pagerTopBar} accessibilityRole="header">
                  <TouchableOpacity
                    onPress={goPrevPage}
                    disabled={page === 0}
                    style={[styles.navBtn, page === 0 && styles.navBtnDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel="Previous page"
                    accessibilityState={{ disabled: page === 0 }}
                  >
                    <Text style={styles.navBtnText} allowFontScaling={false}>‹</Text>
                  </TouchableOpacity>

                  <Text style={styles.pageCounter} maxFontSizeMultiplier={2}>
                    Page {page + 1} of {totalPages}
                  </Text>

                  <TouchableOpacity
                    onPress={goNextPage}
                    disabled={page === totalPages - 1}
                    style={[styles.navBtn, page === totalPages - 1 && styles.navBtnDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel="Next page"
                    accessibilityState={{ disabled: page === totalPages - 1 }}
                  >
                    <Text style={styles.navBtnText} allowFontScaling={false}>›</Text>
                  </TouchableOpacity>
                </View>

                {/* Pager (two pages) */}
                <View onLayout={onPagerLayout} style={styles.pagerWrap}>
                  <ScrollView
                    ref={pagerRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    onScroll={onPagerScroll}
                  >
                    {gurudevPages.map((p, idx) => (
                      <View key={idx} style={{ width: pagerW }}>
                        <Image
                          source={p.image}
                          style={{ width: pagerW, height: imgH, borderRadius: 12 }}
                          resizeMode="contain" // no cropping
                        />
                        <Text style={[styles.h2, { marginTop: 10 }]} maxFontSizeMultiplier={2.1}>
                          {p.title}
                        </Text>
                        <Text style={styles.modalBody} maxFontSizeMultiplier={2.2}>
                          {p.body}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Dots */}
                  <View style={styles.dots}>
                    {gurudevPages.map((_, i) => (
                      <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
                    ))}
                  </View>

                  {/* Swipe hint */}
                  <Text style={styles.swipeHint} maxFontSizeMultiplier={1.6}>
                    Swipe left/right or use the arrows
                  </Text>
                </View>

                {/* Bottom action row: Previous / Next (or Close on last page) */}
                <View style={styles.pagerButtonsRow}>
                  <Pressable
                    onPress={goPrevPage}
                    disabled={page === 0}
                    style={[styles.secondaryBtn, page === 0 && { opacity: 0.5 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Go to previous page"
                  >
                    <Text style={styles.secondaryBtnText} maxFontSizeMultiplier={1.8}>Previous</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (page < totalPages - 1) goNextPage();
                      else setGurudevVisible(false);
                    }}
                    style={styles.primaryBtn}
                    accessibilityRole="button"
                    accessibilityLabel={page < totalPages - 1 ? 'Go to next page' : 'Close'}
                  >
                    <Text style={styles.primaryBtnText} maxFontSizeMultiplier={1.8}>
                      {page < totalPages - 1 ? 'Next' : 'Close'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
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

  topCards: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 20 },
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
  cardText: { fontSize: 15, fontWeight: '600', color: GREEN, textAlign: 'center', flexShrink: 1 },

  sectionTitle: { marginTop: 6, fontSize: 18, fontWeight: '700', color: GREEN, marginBottom: 10, textAlign: 'left', paddingHorizontal: 2 },
  logo: { width: 300, height: 300, borderRadius: 30, alignSelf: 'center', marginBottom: 16 },

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
  thumbSmall: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#EEE', marginRight: 10 },
  listTextWrap: { flex: 1, paddingRight: 8 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#2E2C2B', lineHeight: 20, flexShrink: 1 },
  listHint: { fontSize: 12, color: '#7A8460', marginTop: 2 },
  chev: { fontSize: 24, color: GREEN, marginLeft: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: 20 },
  ul: { marginVertical: 10, paddingLeft: 20 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333', marginTop: 9, marginRight: 10 },
  bulletText: { flex: 1, fontSize: 15, color: '#333', lineHeight: 22 },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: GREEN_SOFT,
    height: '85%',
    width: '92%',
    alignSelf: 'center',
    flexDirection: 'column',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: GREEN, marginBottom: 10 },
  modalBodyWrap: { flex: 1, minHeight: 0, marginTop: 6, marginBottom: 12 },
  modalBodyContent: { paddingBottom: 8, flexGrow: 1 },
  modalBody: { fontSize: 15, color: '#363A2B', lineHeight: 22 },

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
  submitButton: { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, minHeight: 52, justifyContent: 'center' },
  submitButtonText: { color: '#FDFAF5', fontWeight: '700', fontSize: 15 },
  closeButton: { backgroundColor: '#EAF3DC', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10, minHeight: 48, justifyContent: 'center' },
  closeButtonText: { color: GREEN_DEEP, fontWeight: '700', fontSize: 14 },
  websiteButton: { backgroundColor: '#EAF3DC', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  websiteButtonText: { color: GREEN_DEEP, fontSize: 16, fontWeight: '600' },

  h2: { fontSize: 18, fontWeight: '700', color: '#2E2C2B', marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 16, fontWeight: '700', color: '#2E2C2B', marginTop: 12, marginBottom: 6 },
  p: { fontSize: 15, lineHeight: 22, color: '#363A2B', marginBottom: 8 },

  /* Pager (two-page) */
  pagerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pageCounter: { fontSize: 14, fontWeight: '700', color: '#2E2C2B' },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0F5E8', borderWidth: 1, borderColor: GREEN_SOFT,
  },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { fontSize: 20, color: GREEN, lineHeight: 20 },

  pagerWrap: { width: '100%', alignSelf: 'center', marginBottom: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.15)' },
  dotActive: { backgroundColor: '#7AA657' },
  swipeHint: { textAlign: 'center', marginTop: 6, fontSize: 12, color: '#7A8460' },

  pagerButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FDFAF5', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#EAF3DC',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GREEN_SOFT,
  },
  secondaryBtnText: { color: GREEN_DEEP, fontWeight: '700', fontSize: 14 },
});
