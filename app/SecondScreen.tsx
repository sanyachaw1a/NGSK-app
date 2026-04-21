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
  useWindowDimensions,
} from 'react-native';

import { db } from './firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

// ── Brand tokens (must match index.tsx) ─────────────────────────────────────
const LIGHT = {
  saffron:   '#E06B1F',
  teal:      '#13302E',
  gold:      '#C89B3C',
  ember:     '#F2A65A',
  ivory:     '#F8F1E6',
  parchment: '#FBF6EE',
  ivoryDeep: '#F0E6D4',
  ink:       '#1A1612',
  muted:     '#6B6054',
};
const DARK = {
  saffron:   '#F2935A',
  teal:      '#A8C5C0',
  gold:      '#D4A84B',
  ember:     '#C47840',
  ivory:     '#0F1E1B',
  parchment: '#162421',
  ivoryDeep: '#1E3028',
  ink:       '#F0E6D4',
  muted:     '#8A9E9B',
};
type Colors = typeof LIGHT;

// ── URL helpers ───────────────────────────────────────────────────────────────
async function openYouTubeLink(opts: { videoId?: string; playlistId?: string; channelId?: string; url?: string }) {
  let webUrl = opts.url;
  if (!webUrl) {
    if (opts.videoId)    webUrl = `https://www.youtube.com/watch?v=${opts.videoId}`;
    else if (opts.playlistId) webUrl = `https://www.youtube.com/playlist?list=${opts.playlistId}`;
    else if (opts.channelId)  webUrl = `https://www.youtube.com/channel/${opts.channelId}`;
  }
  const appUrl = opts.videoId   ? `vnd.youtube:${opts.videoId}`
               : opts.playlistId ? `vnd.youtube://playlist?list=${opts.playlistId}`
               : opts.channelId  ? `vnd.youtube://channel/${opts.channelId}`
               : undefined;
  try { if (appUrl) { await Linking.openURL(appUrl); return; } } catch {}
  if (webUrl) {
    try { await WebBrowser.openBrowserAsync(webUrl); return; } catch {
      try { await Linking.openURL(webUrl); } catch {}
    }
  }
}

async function openUrlNormalized(url: string) {
  const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try { await WebBrowser.openBrowserAsync(finalUrl); } catch {
    try { await Linking.openURL(finalUrl); } catch {}
  }
}

function openSmartUrl(url: string) {
  if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url)) {
    const mVid  = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&/]+)/);
    const mList = url.match(/[?&]list=([^&]+)/);
    if (mVid?.[1])  return openYouTubeLink({ videoId: decodeURIComponent(mVid[1]) });
    if (mList?.[1]) return openYouTubeLink({ playlistId: decodeURIComponent(mList[1]) });
    return openYouTubeLink({ url });
  }
  return openUrlNormalized(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SecondScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const C = isDark ? DARK : LIGHT;
  const S = makeStyles(C);

  const { width: winW, height: winH } = useWindowDimensions();
  const cardGap = 12;
  const pad = 20;
  const quickLinkCardW = Math.floor((winW - pad * 2 - cardGap) / 2);

  const [aboutVisible,   setAboutVisible]   = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [gurudevVisible, setGurudevVisible] = useState(false);

  const [fullName,    setFullName]    = useState('');
  const [country,     setCountry]     = useState('');
  const [whatsapp,    setWhatsapp]    = useState('');
  const [message,     setMessage]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const pagerRef = useRef<ScrollView>(null);
  const [pagerW, setPagerW] = useState(0);
  const [pagerH, setPagerH] = useState(0);
  const [imgH,   setImgH]   = useState(200);
  const [page,   setPage]   = useState(0);

  const onPagerLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e?.nativeEvent?.layout ?? { width: 0, height: 0 };
    if (w && w !== pagerW) {
      setPagerW(w);
      setImgH(Math.min(Math.round((w * 9) / 16), 220));
      requestAnimationFrame(() => pagerRef.current?.scrollTo({ x: page * w, y: 0, animated: false }));
    }
    if (h && h !== pagerH) setPagerH(h);
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
      body: `Brahmgyani Mahant Baba Ram Singh Ji Maharaj is the Current Spiritual Head of Nirmal Ashram, Rishikesh—a spiritual sanctuary that welcomes all seekers and embodies the principle of 'Love All, Serve All'.

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
      image: require('../assets/images/jodh-maharaj-ji.jpg'),
      title: 'Sant Baba Jodh Singh Ji Maharaj',
      body: `Sant Baba Jodh Singh Ji Maharaj is an embodiment of selfless and devoted service to the Guru and God. With the blessings of His Holiness Mahant Baba Ram Singh Ji Maharaj, his tireless dedication, meticulous care, and unwavering commitment to sewa have given rise to numerous philanthropic institutions affiliated with Nirmal Ashram, as well as the growth of Nirmal Kutias across North India. Through his guidance, he continues to nurture the Ashram's spiritual mission and keep alive its vision of love, humility, and service.`,
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

  useEffect(() => {
    if (gurudevVisible) {
      setPage(0);
      requestAnimationFrame(() => pagerRef.current?.scrollTo({ x: 0, y: 0, animated: false }));
    }
  }, [gurudevVisible, pagerW]);

  const submitContact = async () => {
    const nameTrim     = fullName.trim();
    const countryTrim  = country.trim();
    const msgTrim      = message.trim();
    const whatsappTrim = whatsapp.trim().replace(/[^\d+]/g, '');
    if (!nameTrim || !countryTrim || !whatsappTrim || !msgTrim) {
      Alert.alert('Missing info', 'Please fill in all fields.'); return;
    }
    if (whatsappTrim.length < 7) {
      Alert.alert('WhatsApp number', 'Please enter a valid WhatsApp number.'); return;
    }
    try {
      setSubmitting(true);
      await addDoc(collection(db, 'contact_messages'), {
        name: nameTrim, country: countryTrim, whatsapp: whatsappTrim,
        message: msgTrim, createdAt: serverTimestamp(), platform: Platform.OS,
      });
      Alert.alert('Thank you', 'Your message has been sent.');
      setContactVisible(false);
      setFullName(''); setCountry(''); setWhatsapp(''); setMessage('');
    } catch {
      Alert.alert('Error', 'Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const playlists = [
    { title: 'NGSK Study Material',    subtitle: 'Drive folder',      thumbnail: require('../assets/images/study-material.jpg'),    url: 'https://drive.google.com/drive/folders/1kHpvzO6TKFwtGhYb4ZULz_BYo_GHtm42?usp=drive_link' },
    { title: 'Learn Gurmukhi Series',  subtitle: 'Beginner series',   thumbnail: require('../assets/images/learn-gurumukhi.jpg'),   url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNicZKh7_RnugSKLuSXz2x9A' },
    { title: 'Learn Gurbani Series',   subtitle: 'Scripture reading', thumbnail: require('../assets/images/learn-gurbani.jpg'),     url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNh1KZlJvN3FF2aOqcQ5Fioq' },
    { title: 'Events & Celebrations',  subtitle: 'Programs & seva',   thumbnail: require('../assets/images/ngsk-events.jpg'),       url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNiN6PO-W5kNV1aGWz3PM3MM' },
    { title: 'Chronicles of Grace',    subtitle: 'Seva stories',      thumbnail: require('../assets/images/chronicles-of-grace.jpg'), url: 'https://www.youtube.com/playlist?list=PL8SWO6yqWeNh4z8FaKEp-ijx9ZvUQH1Ve' },
    { title: 'YouTube Channel',        subtitle: 'Full channel',      thumbnail: require('../assets/images/explore-youtube.jpg'),   url: 'https://www.youtube.com/@Insahaj' },
  ];

  return (
    <SafeAreaView style={S.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={S.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={S.headerRow}>
          <Text style={S.pageTitle}>Learn</Text>
          <Text style={S.eyebrow}>SEVA · STUDY · STILLNESS</Text>
          <View style={S.ctaRow}>
            <TouchableOpacity style={S.ctaPill} onPress={() => setAboutVisible(true)} activeOpacity={0.8}>
              <Text style={S.ctaPillText}>About NGSK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.ctaPill, S.ctaPillDark]} onPress={() => setContactVisible(true)} activeOpacity={0.8}>
              <Text style={[S.ctaPillText, S.ctaPillTextDark]}>Get in touch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick Links ── */}
        <Text style={S.sectionTitle}>Quick Links</Text>
        <View style={[S.grid, { gap: cardGap, marginTop: 12 }]}>
          {playlists.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[S.gridCard, { width: quickLinkCardW }]}
              onPress={() => openSmartUrl(p.url)}
              activeOpacity={0.85}
            >
              <Image source={p.thumbnail} style={S.iconChip} resizeMode="cover" />
              <Text style={S.gridTitle} numberOfLines={2}>{p.title}</Text>
              <Text style={S.gridSub}>{p.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── About Gurudev CTA ── */}
        <TouchableOpacity style={S.featuredCard} onPress={() => setGurudevVisible(true)} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={S.featuredTitle}>About Gurudev{'\n'}Maharaj Ji</Text>
          </View>
          <View style={S.featuredArrow}>
            <Ionicons name="arrow-forward" size={18} color={C.teal} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ── About NGSK Modal ── */}
      <Modal visible={aboutVisible} transparent animationType="slide" onRequestClose={() => setAboutVisible(false)}>
        <View style={S.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAboutVisible(false)} />
          <View style={S.modalCard}>
            <View style={S.gurudevTopBar}>
              <Text style={S.modalTitle}>About NGSK</Text>
              <TouchableOpacity onPress={() => setAboutVisible(false)} style={S.closeIcon} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={C.ink} />
              </TouchableOpacity>
            </View>
            <View style={S.modalBodyWrap}>
              <ScrollView contentContainerStyle={S.modalBodyContent} showsVerticalScrollIndicator={false}>
                <Image source={require('../assets/images/icon.png')} style={S.logo} />
                <Text style={S.h2}>About NGSK, Rishikesh</Text>
                <Text style={S.p}>
                  Nirmal Ashram Gurbani Shiksha Kendra, Rishikesh (NGSK) is an online sewa initiative
                  founded on 3rd September 2020, by and with the divine blessings and infinite grace
                  of our beloved Gurudev, Brahmgyani Mahant Baba Ram Singh Ji Maharaj, Spiritual Head
                  of Nirmal Ashram Rishikesh and Sant Baba Jodh Singh Ji Maharaj.
                </Text>
                <Text style={S.p}>
                  Rooted in nishkam sewa (selfless service) and simran (constant remembrance of the One
                  Lord), NGSK Rishikesh was born from Maharaj Ji's boundless compassion for humanity — to
                  uplift and connect sincere seekers with the sacred vibrations of Gurbani.
                </Text>
                <Text style={S.p}>
                  Gurbani is a priceless treasure — the sacred medium through which the Lord's Word was
                  spoken, recorded, and revealed in the form of Sri Guru Granth Sahib Ji.
                </Text>
                <Text style={S.h3}>Vision</Text>
                <Text style={S.p}>
                  To awaken all hearts to the light of the One Lord that shines within us all, through the
                  sacred medium of Gurbani.
                </Text>
                <Text style={S.h3}>Mission</Text>
                <View style={S.ul}>
                  {[
                    'To honour Gurbani with the reverence and love it truly deserves.',
                    'To offer selfless service and heartfelt guidance in the sacred journey of reading Gurbani correctly — with devotion, clarity, and care.',
                    'To help seekers turn inward — disconnecting from the fleeting world, and connecting with the eternal self through the light of Gurbani.',
                    'To gently remind ourselves of the true purpose of this rare and precious human birth: self-realisation — union with the Divine.',
                  ].map((t, i) => (
                    <View key={i} style={S.bulletRow}>
                      <View style={S.bulletDot} />
                      <Text style={S.bulletText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <Text style={S.h3}>What we teach</Text>
                <Text style={S.p}>
                  Through online classes, NGSK supports learners in reading Gurbani correctly in Gurmukhi, Hindi and English, with focus on Shudh Uchaaran, Vishraams, and Bhavnaa.
                </Text>
                <Text style={S.p}>
                  As of 2025, over 1300 seekers from 23 countries have joined this sacred journey, guided by more than 100 devoted teachers worldwide.
                </Text>
              </ScrollView>
            </View>
            <Pressable style={S.websiteButton} onPress={() => Linking.openURL('https://ngsk.info')}>
              <Text style={S.websiteButtonText}>Visit our website</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Contact Modal ── */}
      <Modal visible={contactVisible} transparent animationType="slide" onRequestClose={() => setContactVisible(false)}>
        <View style={S.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setContactVisible(false)} />
          <View style={S.modalCard}>
            <View style={S.gurudevTopBar}>
              <Text style={S.modalTitle}>Get in Touch</Text>
              <TouchableOpacity onPress={() => setContactVisible(false)} style={S.closeIcon} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={C.ink} />
              </TouchableOpacity>
            </View>
            {(['Full name', 'Country', 'WhatsApp number'] as const).map((ph, i) => (
              <TextInput
                key={ph}
                placeholder={ph}
                value={[fullName, country, whatsapp][i]}
                onChangeText={[setFullName, setCountry, setWhatsapp][i]}
                keyboardType={i === 2 ? 'phone-pad' : 'default'}
                style={S.input}
                placeholderTextColor={C.muted}
              />
            ))}
            <TextInput
              placeholder="Message"
              value={message}
              onChangeText={setMessage}
              style={[S.input, S.inputMultiline]}
              multiline numberOfLines={4} textAlignVertical="top"
              placeholderTextColor={C.muted}
            />
            <Pressable style={[S.submitButton, submitting && { opacity: 0.6 }]} onPress={submitContact} disabled={submitting}>
              <Text style={S.submitButtonText}>{submitting ? 'Sending…' : 'Send'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Gurudev Modal ── */}
      <Modal visible={gurudevVisible} transparent animationType="slide" onRequestClose={() => setGurudevVisible(false)}>
        <View style={S.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setGurudevVisible(false)} />
          <View style={S.modalCard}>

            {/* Top bar: title + close */}
            <View style={S.gurudevTopBar}>
              <Text style={S.modalTitle}>About Gurudev{'\n'}Maharaj Ji</Text>
              <TouchableOpacity onPress={() => setGurudevVisible(false)} style={S.closeIcon} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={C.ink} />
              </TouchableOpacity>
            </View>

            {/* Pager */}
            <View onLayout={onPagerLayout} style={S.pagerWrap}>
              <ScrollView
                ref={pagerRef} horizontal pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16} decelerationRate="fast"
                onScroll={onPagerScroll}
                style={pagerH ? { height: pagerH } : { flex: 1 }}
              >
                {gurudevPages.map((p, idx) => (
                  <ScrollView
                    key={idx}
                    style={{ width: pagerW, height: pagerH || undefined }}
                    contentContainerStyle={{ paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    <Image source={p.image} style={{ width: pagerW, height: imgH, borderRadius: 12 }} resizeMode="contain" />
                    <Text style={[S.h2, { marginTop: 10 }]}>{p.title}</Text>
                    <Text style={S.modalBody}>{p.body}</Text>
                  </ScrollView>
                ))}
              </ScrollView>
            </View>

            {/* Dots */}
            <View style={S.dots}>
              {gurudevPages.map((_, i) => (
                <View key={i} style={[S.dot, i === page && S.dotActive]} />
              ))}
            </View>

            {/* Prev / Next arrows */}
            <View style={S.pagerTopBar}>
              <TouchableOpacity onPress={goPrevPage} disabled={page === 0} style={[S.navBtn, page === 0 && S.navBtnDisabled]}>
                <Ionicons name="arrow-back" size={18} color={C.saffron} />
              </TouchableOpacity>
              <Text style={S.pageCounter}>{page + 1} / {totalPages}</Text>
              <TouchableOpacity onPress={goNextPage} disabled={page === totalPages - 1} style={[S.navBtn, page === totalPages - 1 && S.navBtnDisabled]}>
                <Ionicons name="arrow-forward" size={18} color={C.saffron} />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(C: Colors) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: C.ivory },
    container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, alignItems: 'center' },

    // Header
    headerRow: {
      flexDirection: 'column', alignItems: 'flex-start',
      marginTop: 12, marginBottom: 24, width: '100%',
    },
    eyebrow: {
      fontFamily: 'Inter-SemiBold', fontSize: 10, color: C.saffron,
      letterSpacing: 1.6, marginBottom: 4,
    },
    pageTitle: { fontFamily: 'Fraunces-Regular', fontSize: 36, color: C.teal, lineHeight: 42 },
    ctaRow:    { flexDirection: 'row', gap: 8, marginTop: 12 },
    ctaPill: {
      paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14,
      backgroundColor: C.parchment, borderWidth: 1, borderColor: C.ivoryDeep,
    },
    ctaPillDark: { backgroundColor: C.teal, borderColor: C.teal },
    ctaPillText:     { fontFamily: 'Inter-SemiBold', fontSize: 12, color: C.ink, textAlign: 'center' },
    ctaPillTextDark: { color: '#FFFFFF' },

    // Section header
    sectionHeaderRow: {
      flexDirection: 'row', alignItems: 'baseline',
      justifyContent: 'space-between', marginBottom: 12,
    },
    sectionTitle: { fontFamily: 'Fraunces-Regular', fontSize: 22, color: C.ink, width: '100%' },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, width: '100%', justifyContent: 'center' },
    gridCard: {
      backgroundColor: C.parchment, borderRadius: 16,
      padding: 14,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    iconChip: {
      width: 80, height: 36, borderRadius: 8,
      marginBottom: 10, overflow: 'hidden',
    },
    gridTitle: {
      fontFamily: 'Inter-SemiBold', fontSize: 13, color: C.ink,
      lineHeight: 18, marginBottom: 3,
    },
    gridSub: { fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted },

    // Featured Reading card
    featuredCard: {
      backgroundColor: C.teal, borderRadius: 20,
      padding: 20, flexDirection: 'row', alignItems: 'center',
    },
    featuredLabel: {
      fontFamily: 'Inter-SemiBold', fontSize: 10, color: C.saffron,
      letterSpacing: 1.6, marginBottom: 6,
    },
    featuredTitle: {
      fontFamily: 'Fraunces-SemiBold', fontSize: 22, color: '#FFFFFF', lineHeight: 28,
    },
    featuredArrow: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
    },

    // Modal shared
    modalBackdrop: {
      flex: 1, backgroundColor: 'rgba(19,48,46,0.4)',
      justifyContent: 'center', padding: 20,
    },
    modalCard: {
      backgroundColor: C.parchment, borderRadius: 24, padding: 22,
      borderWidth: 1, borderColor: C.ivoryDeep,
      height: '88%', width: '100%', maxWidth: 420,
      alignSelf: 'center', flexDirection: 'column',
    },
    modalHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: C.ivoryDeep, alignSelf: 'center', marginBottom: 14,
    },
    modalTitle:       { fontFamily: 'Fraunces-SemiBold', fontSize: 22, color: C.teal, marginBottom: 12 },
    modalBodyWrap:    { flex: 1, minHeight: 0, marginBottom: 14 },
    modalBodyContent: { paddingBottom: 12, flexGrow: 1 },
    modalBody:        { fontFamily: 'Fraunces-Light', fontSize: 15, color: C.ink, lineHeight: 24 },

    // About content
    logo: { width: 120, height: 120, borderRadius: 16, alignSelf: 'center', marginBottom: 16 },
    h2:   { fontFamily: 'Fraunces-SemiBold', fontSize: 17, color: C.teal, marginTop: 16, marginBottom: 8 },
    h3:   { fontFamily: 'Fraunces-SemiBold', fontSize: 15, color: C.teal, marginTop: 14, marginBottom: 6 },
    p:    { fontFamily: 'Fraunces-Light', fontSize: 15, lineHeight: 24, color: C.ink, marginBottom: 10 },
    ul:   { marginVertical: 10 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.saffron, marginTop: 10, marginRight: 10 },
    bulletText: { fontFamily: 'Fraunces-Light', flex: 1, fontSize: 15, color: C.ink, lineHeight: 23 },

    // Contact inputs
    input: {
      borderWidth: 1, borderColor: C.ivoryDeep, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 14, marginTop: 10,
      backgroundColor: C.ivory, color: C.ink, minHeight: 48,
      fontFamily: 'Inter-Regular', fontSize: 15,
    },
    inputMultiline: { minHeight: 110 },

    // Buttons
    submitButton: {
      backgroundColor: C.saffron, borderRadius: 14,
      paddingVertical: 14, alignItems: 'center', marginTop: 14,
      minHeight: 52, justifyContent: 'center',
    },
    submitButtonText: { fontFamily: 'Inter-SemiBold', color: '#FFFFFF', fontSize: 15 },
    closeButton: {
      backgroundColor: C.ivoryDeep, borderRadius: 14,
      paddingVertical: 12, alignItems: 'center', marginTop: 10,
      minHeight: 48, justifyContent: 'center',
    },
    closeButtonText: { fontFamily: 'Inter-SemiBold', color: C.saffron, fontSize: 14 },
    websiteButton: {
      backgroundColor: C.ivory, borderWidth: 1, borderColor: C.ivoryDeep,
      paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14,
      marginTop: 10, alignItems: 'center',
    },
    websiteButtonText: { fontFamily: 'Inter-SemiBold', color: C.teal, fontSize: 14 },

    // Gurudev modal header
    gurudevTopBar: {
      flexDirection: 'row', alignItems: 'flex-start',
      justifyContent: 'space-between', marginBottom: 16,
    },
    closeIcon: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.ivoryDeep, alignItems: 'center', justifyContent: 'center',
    },

    // Pager
    pagerTopBar: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginTop: 14,
    },
    pageCounter: { fontFamily: 'Inter-Medium', fontSize: 13, color: C.muted },
    navBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.ivoryDeep,
    },
    navBtnDisabled: { opacity: 0.35 },
    navBtnText: { fontSize: 22, color: C.saffron, lineHeight: 22 },
    pagerWrap:  { flex: 1, width: '100%' },
    dots:       { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 8 },
    dot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: C.ivoryDeep },
    dotActive:  { backgroundColor: C.saffron },
    swipeHint:  { fontFamily: 'Inter-Regular', textAlign: 'center', marginTop: 6, fontSize: 11, color: C.muted },
    pagerButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    primaryBtn: {
      flex: 1, backgroundColor: C.saffron, borderRadius: 14,
      paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    },
    primaryBtnText: { fontFamily: 'Inter-SemiBold', color: '#FFFFFF', fontSize: 15 },
    secondaryBtn: {
      flex: 1, backgroundColor: C.ivoryDeep, borderRadius: 14,
      paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    },
    secondaryBtnText: { fontFamily: 'Inter-SemiBold', color: C.ink, fontSize: 14 },
  });
}
