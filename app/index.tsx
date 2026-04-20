// index.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Pressable,
  AppState,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ImageSourcePropType } from 'react-native';
import type { NotificationBehavior } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

// ── Brand tokens ──────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTimeOfDay(): { label: string; heroWord: string } {
  const h = new Date().getHours();
  if (h >= 4 && h < 7)  return { label: 'AMRIT VELA',  heroWord: 'remembrance.' };
  if (h >= 7 && h < 12) return { label: 'MORNING',     heroWord: 'gratitude.'   };
  if (h >= 12 && h < 17) return { label: 'AFTERNOON',  heroWord: 'service.'     };
  if (h >= 17 && h < 20) return { label: 'EVENING',    heroWord: 'reflection.'  };
  return                        { label: 'NIGHT',       heroWord: 'remembrance.' };
}

function getDateLabel(): string {
  const now  = new Date();
  const day  = now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  return `${day} · ${date}`;
}

// Foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function openYouTubeLink(opts: {
  videoId?: string; playlistId?: string; channelId?: string; url?: string;
}) {
  let webUrl = opts.url;
  if (!webUrl) {
    if (opts.videoId)         webUrl = `https://www.youtube.com/watch?v=${opts.videoId}`;
    else if (opts.playlistId) webUrl = `https://www.youtube.com/playlist?list=${opts.playlistId}`;
    else if (opts.channelId)  webUrl = `https://www.youtube.com/channel/${opts.channelId}`;
  }
  const appUrl = opts.videoId    ? `vnd.youtube:${opts.videoId}`
    : opts.playlistId ? `vnd.youtube://playlist?list=${opts.playlistId}`
    : opts.channelId  ? `vnd.youtube://channel/${opts.channelId}`
    : undefined;
  try { if (appUrl) { await Linking.openURL(appUrl); return; } } catch {}
  if (webUrl) {
    try { await WebBrowser.openBrowserAsync(webUrl); return; } catch {}
    try { await Linking.openURL(webUrl); } catch {}
  }
}

async function openUrlNormalized(url: string) {
  const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try { await WebBrowser.openBrowserAsync(finalUrl); }
  catch { try { await Linking.openURL(finalUrl); } catch {} }
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

const YOUTUBE_API_KEY = 'AIzaSyBtc9BFVigZ0fn6IrugqhVTNk6ikjbMzH8';
const PLAYLIST_ID  = 'PL8SWO6yqWeNimurvjsEJp9z1w_roqPbRz';
const CHANNEL_ID   = 'UCwhkvqY1koXSP-L-Ke7Y6jQ';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ── PlaylistCard ──────────────────────────────────────────────────────────────
function PlaylistCard({ title, url, thumbnail, theme }: {
  title: string; url: string; thumbnail: ImageSourcePropType; theme: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity style={theme.playlistCard} onPress={() => openSmartUrl(url)} activeOpacity={0.9}>
      <View style={theme.playlistThumbWrapper}>
        <Image source={thumbnail} style={theme.playlistThumbnail} />
      </View>
      <Text style={theme.playlistTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

// ── MeditationButton ──────────────────────────────────────────────────────────
function MeditationButton({ title, subtitle, source, gradientColors, C, theme }: {
  title: string; subtitle: string; source: any; gradientColors: [string, string]; C: Colors; theme: ReturnType<typeof makeStyles>;
}) {
  const [sound, setSound]               = useState<Audio.Sound | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isPlaying, setIsPlaying]       = useState(true);
  const [position, setPosition]         = useState(0);
  const [duration, setDuration]         = useState(1);
  const insets = useSafeAreaInsets();

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (modalVisible) {
      (async () => {
        const { sound: s } = await Audio.Sound.createAsync(source, { shouldPlay: true });
        s.setOnPlaybackStatusUpdate((st) => {
          if (!st.isLoaded) return;
          setPosition(st.positionMillis);
          setDuration(st.durationMillis || 1);
          setIsPlaying(st.isPlaying);
        });
        setSound(s);
      })();
    }
    return () => { sound?.unloadAsync(); setSound(null); };
  }, [modalVisible]);

  const handleStop = async () => {
    await sound?.stopAsync(); await sound?.unloadAsync();
    setSound(null); setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={theme.meditationButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={theme.iconCircle}
        >
          <Image source={require('../assets/diya-logo.png')} style={theme.divaImage} />
        </LinearGradient>
        <Text style={theme.meditationGurmukhi}>{title}</Text>
        <Text style={theme.meditationSubtitle}>{subtitle}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable
          onPress={handleStop}
          style={[theme.modalOverlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}
        >
          <Pressable onPress={() => {}} style={theme.modalContent}>
            <Text style={theme.modalTitle}>{title}</Text>
            <Text style={theme.modalSubtitleText}>{subtitle}</Text>

            <Slider
              style={{ width: '90%', marginTop: 16 }}
              minimumValue={0} maximumValue={duration} value={position}
              onSlidingComplete={(v) => sound?.setPositionAsync(v)}
              minimumTrackTintColor={C.saffron} maximumTrackTintColor={C.ivoryDeep}
            />
            <Text style={theme.timeText}>{formatTime(position)} / {formatTime(duration)}</Text>

            <View style={theme.audioControls}>
              <TouchableOpacity style={theme.audioButton}
                onPress={() => isPlaying ? sound?.pauseAsync() : sound?.playAsync()}>
                <Text style={theme.audioButtonText}>{isPlaying ? '⏸ Pause' : '▶ Play'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[theme.audioButton, { backgroundColor: C.ivoryDeep }]} onPress={handleStop}>
                <Text style={[theme.audioButtonText, { color: C.saffron }]}>✕ Stop</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── MainScreen ────────────────────────────────────────────────────────────────
export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const [isDark, setIsDark]                 = useState(false);
  const C = isDark ? DARK : LIGHT;
  const styles = useMemo(() => makeStyles(C), [isDark]);
  const [latestVideo, setLatestVideo]       = useState<any>(null);
  const [socialVisible, setSocialVisible]   = useState(false);
  const [nirmalVisible, setNirmalVisible]   = useState(false);
  const [slide, setSlide]                   = useState(0);
  const [displayW, setDisplayW]             = useState(screenWidth * 0.92);
  const [displayH, setDisplayH]             = useState(Math.round((screenWidth * 9) / 16));
  const scrollRef     = useRef<ScrollView>(null);
  const didInitAudio  = useRef(false);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isLive, setIsLive]                 = useState(false);
  const [hasAlertedForThisLive, setHasAlertedForThisLive] = useState(false);

  const { label: timeLabel, heroWord } = getTimeOfDay();
  const dateLabel = getDateLabel();

  const nirmalImages = [
    require('../assets/images/about-1.jpeg'),
    require('../assets/images/about-2.jpeg'),
    require('../assets/images/about-3.jpeg'),
  ];

  useEffect(() => {
    if (didInitAudio.current) return;
    didInitAudio.current = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) { console.warn('Failed to set audio mode', e); }
    })();
  }, []);

  useEffect(() => { fetchLatestVideo(); }, []);

  async function fetchLatestVideo() {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=1&key=${YOUTUBE_API_KEY}`
      );
      if (res.ok) {
        const data = await res.json();
        const item = data?.items?.[0];
        if (item?.snippet?.resourceId?.videoId) {
          setLatestVideo({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
          });
          return;
        }
      }
    } catch {}

    try {
      const rss   = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`);
      const xml   = await rss.text();
      const entry = xml.split('<entry>')[1];
      const id    = entry?.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
      const title = entry?.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      if (id && title) { setLatestVideo({ id, title }); return; }
    } catch {}

    try {
      const rss   = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`);
      const xml   = await rss.text();
      const entry = xml.split('<entry>')[1];
      const id    = entry?.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
      const title = entry?.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      if (id && title) { setLatestVideo({ id, title }); return; }
    } catch {}

    setLatestVideo(null);
  }

  useEffect(() => {
    const start = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(checkLiveAndNotify, 60000);
      checkLiveAndNotify();
    };
    const stop = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    start();
    const sub = AppState.addEventListener('change', (s) => s === 'active' ? start() : stop());
    return () => { sub.remove(); stop(); };
  }, []);

  async function checkLiveAndNotify() {
    try {
      const res  = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`
      );
      const json = await res.json();
      const goingLive = Array.isArray(json.items) && json.items.length > 0;
      setIsLive(goingLive);
      if (goingLive && !hasAlertedForThisLive) {
        const live = json.items[0];
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔴 Sahaj Katha is LIVE',
            body: live.snippet?.title || 'Sahaj Katha is live',
            data: { url: `https://www.youtube.com/watch?v=${live.id?.videoId}` },
          },
          trigger: null,
        });
        setHasAlertedForThisLive(true);
      } else if (!goingLive && hasAlertedForThisLive) {
        setHasAlertedForThisLive(false);
      }
    } catch (e) { console.warn('Live check failed', e); }
  }

  const CARD_HEIGHT     = Math.min(Math.round(screenHeight * 0.82), 720);
  const onCarouselLayout = (e: any) => {
    const w = e?.nativeEvent?.layout?.width ?? screenWidth * 0.92;
    const h = Math.min(Math.round((w * 9) / 16), Math.round(CARD_HEIGHT * 0.45));
    setDisplayW(w); setDisplayH(h);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: (slide || 0) * w, animated: false }));
  };
  const onCarouselScroll = (e: any) => {
    const i = Math.round((e?.nativeEvent?.contentOffset?.x ?? 0) / Math.max(displayW, 1));
    if (i !== slide) setSlide(i);
  };

  const kathaDate = latestVideo?.publishedAt
    ? new Date(latestVideo.publishedAt)
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        .toUpperCase()
    : '';

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ right: 1, bottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../assets/diya-logo.png')} style={styles.headerLogo} />
            <View>
              <Text style={styles.headerBrand}>NGSK</Text>
              <Text style={styles.headerLocation}>RISHIKESH</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsDark(d => !d)}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={C.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setSocialVisible(true)}>
              <Ionicons name="link-outline" size={18} color={C.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Date / greeting ── */}
        <Text style={styles.dateLine}>{dateLabel} · {timeLabel}</Text>
        <Text style={styles.heroLine}>
          Begin in <Text style={styles.heroItalic}>{heroWord}</Text>
        </Text>

        {/* ── Meditation buttons ── */}
        <View style={styles.meditationSection}>
          <MeditationButton
            title="ਸਤਿਨਾਮ ਵਾਹਿਗੁਰੂ"
            subtitle="Satnam Waheguru"
            source={require('../assets/audio/Satnam-Waheguru-MJ.mp3')}
            gradientColors={['#FFF5EC', '#F2A65A']}
            C={C} theme={styles}
          />
          <MeditationButton
            title="ਮੂਲ ਮੰਤਰ"
            subtitle="Mul Mantra"
            source={require('../assets/audio/naam-simran.mp3')}
            gradientColors={['#FFFAEE', '#C89B3C']}
            C={C} theme={styles}
          />
          <MeditationButton
            title="ਓਮ ਸਤਿਨਾਮੁ"
            subtitle="Om Satnam"
            source={require('../assets/audio/om-satnam-simran.mp3')}
            gradientColors={['#FFF8F2', '#F2A65A']}
            C={C} theme={styles}
          />
        </View>

        {/* ── Latest Sahaj Katha ── */}
        <View style={styles.kathaCard}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelLine} />
            <Text style={styles.sectionLabel}>{isLive ? '🔴 LIVE NOW' : 'LATEST SAHAJ KATHA'}</Text>
            <View style={styles.sectionLabelLine} />
          </View>

          {latestVideo ? (
            <TouchableOpacity
              onPress={() => openSmartUrl(`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`)}
              activeOpacity={0.9}
            >
              <View style={styles.kathaBanner}>
                <Image
                  source={require('../assets/images/sahaj-katha.jpg')}
                  style={styles.kathaBannerImage}
                />
                <View style={styles.kathaBannerOverlay}>
                  <Text style={styles.kathaBannerTitle}>Daily{'\n'}Sahaj Katha</Text>
                  <View style={styles.kathaDivider} />
                  <Text style={styles.kathaBannerAuthor}>
                    by Brahmgyani Mahant{'\n'}Baba Ram Singh Ji Maharaj
                  </Text>
                  <View style={styles.kathaListenBtn}>
                    <Ionicons name="play-circle" size={16} color={C.teal} />
                    <Text style={styles.kathaListenText}>Listen</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.kathaMetadata}>
                {kathaDate ? `${kathaDate}  ` : ''}
                <Text style={styles.kathaVideoTitle}>{latestVideo.title}</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator size="large" color={C.saffron} />
              <Text style={[styles.kathaMetadata, { marginTop: 8 }]}>Loading latest katha…</Text>
              <TouchableOpacity onPress={fetchLatestVideo} style={[styles.audioButton, { marginTop: 10 }]}>
                <Text style={styles.audioButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Playlists ── */}
        <View style={styles.playlistContainer}>
          <Text style={styles.playlistHeader}>Playlists</Text>
          <View style={[styles.playlistRow, { marginTop: 12 }]}>
            <PlaylistCard
              title="Divine Wisdom"
              url="https://www.youtube.com/playlist?list=PL8SWO6yqWeNiYAmc8fsuN2K6FHbKIukZl"
              thumbnail={require('../assets/playlist-divine-wisdom.png')}
              theme={styles}
            />
            <PlaylistCard
              title="Soulful Kirtan"
              url="https://www.youtube.com/playlist?list=PL8SWO6yqWeNhTf2dqAlH_fBql7s0PJrGL"
              thumbnail={require('../assets/playlist-soulful-kirtan.png')}
              theme={styles}
            />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Social Links Modal ── */}
      <Modal visible={socialVisible} animationType="fade" transparent>
        <Pressable
          onPress={() => setSocialVisible(false)}
          style={[styles.modalOverlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}
        >
          <Pressable onPress={() => {}} style={[styles.modalContent, { alignItems: 'stretch' }]}>
            <Text style={styles.modalTitle}>Stay Connected</Text>

            <Text style={styles.modalSectionLabel}>WhatsApp Broadcast Channel</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => openSmartUrl('https://whatsapp.com/channel/0029VajldkL2ZjCn7NsymG2M')}>
              <Ionicons name="logo-whatsapp" size={20} color={C.saffron} />
              <Text style={styles.linkText}>Open WhatsApp Channel</Text>
              <Ionicons name="chevron-forward" size={18} color={C.saffron} />
            </TouchableOpacity>
            <View style={styles.instructions}>
              <Text style={styles.instructionsItem}>• Click on 'Follow' to join the channel.</Text>
              <Text style={styles.instructionsItem}>• Tap the '🔔 Bell Icon' to turn on notifications.</Text>
              <Text style={styles.instructionsItem}>• Go to the 'Updates' tab at the bottom of your WhatsApp screen to view the channel.</Text>
            </View>

            <Text style={styles.modalSectionLabel}>Instagram</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => openSmartUrl('https://www.instagram.com/in.sahaj/')}>
              <Ionicons name="logo-instagram" size={20} color={C.saffron} />
              <Text style={styles.linkText}>@in.sahaj</Text>
              <Ionicons name="chevron-forward" size={18} color={C.saffron} />
            </TouchableOpacity>

            <Text style={styles.modalSectionLabel}>YouTube</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => openUrlNormalized('https://www.youtube.com/@Insahaj')}>
              <Ionicons name="logo-youtube" size={20} color={C.saffron} />
              <Text style={styles.linkText}>youtube.com/@Insahaj</Text>
              <Ionicons name="chevron-forward" size={18} color={C.saffron} />
            </TouchableOpacity>

            <Pressable style={[styles.audioButton, { marginTop: 14 }]} onPress={() => setSocialVisible(false)}>
              <Text style={styles.audioButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── About Nirmal Ashram Modal ── */}
      <Modal visible={nirmalVisible} transparent animationType="slide" onRequestClose={() => setNirmalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { height: CARD_HEIGHT }]}>
            <Text style={styles.modalTitle} maxFontSizeMultiplier={2.2}>
              About Nirmal Ashram Rishikesh
            </Text>

            <View style={styles.modalBodyWrap}>
              <ScrollView contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator>
                <View style={[styles.carouselWrap, { height: displayH }]} onLayout={onCarouselLayout}>
                  <ScrollView
                    ref={scrollRef}
                    horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                    decelerationRate="fast" scrollEventThrottle={16}
                    onScroll={onCarouselScroll}
                  >
                    {nirmalImages.map((src, idx) => (
                      <Image key={idx} source={src} style={{ width: displayW, height: displayH }} resizeMode="contain" />
                    ))}
                  </ScrollView>
                  <View style={styles.dots}>
                    {nirmalImages.map((_, i) => (
                      <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
                    ))}
                  </View>
                </View>

                <Text style={styles.modalBody} maxFontSizeMultiplier={2.2}>
                  <Text style={{ fontFamily: 'Fraunces-SemiBold' }}>About Nirmal Ashram Rishikesh</Text>
                  {'\n'}
                  Nirmal Ashram is an ancient hermitage that embodies the spirit of selfless service
                  and spiritual learning. Nestled on the banks of the sacred Ganga in the Himalayan
                  town of Rishikesh, it was established in 1903 by Mahant Baba Buddha Singh Ji
                  Maharaj, whose life was devoted to spreading the teachings of Guru Nanak Dev Ji —
                  to see the Divine in all and to Love All, Serve All.
                  {'\n\n'}
                  He was succeeded by Sant Atma Singh Ji Maharaj and later by Mahant Baba Narain
                  Singh Ji Maharaj, both of whom upheld and expanded the Ashram's mission.
                  {'\n\n'}
                  A towering light in this lineage is Sant Baba Nikka Singh Ji Maharaj 'Virakat', a
                  direct disciple of Baba Buddha Singh Ji, who through his tireless travels and
                  spiritual outreach shared the message of Gurbani, sewa, and simran across North India.
                  {'\n\n'}
                  Today, the legacy continues under the divine guidance of his shishya, Brahmgyani
                  Mahant Baba Ram Singh Ji Maharaj, supported by Sant Jodh Singh Ji Maharaj, whose
                  lives radiate love, humility, and unwavering service. We bow in deep reverence to
                  Sarpanch Maharaj Ji, Sant Bharat Ji, and Sant Kanwal Ji.
                  {'\n\n'}
                  With gratitude, we honour all the Saints of Nirmal Ashram.
                </Text>
              </ScrollView>
            </View>

            <Pressable style={styles.closeButton} onPress={() => setNirmalVisible(false)}>
              <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.8}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(C: Colors) { return StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.ivory },
  container: { paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 8,
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo:     { width: 36, height: 36, resizeMode: 'contain' },
  headerBrand:    { fontFamily: 'Inter-Bold', fontSize: 15, color: C.teal, letterSpacing: 0.5 },
  headerLocation: { fontFamily: 'Inter-Medium', fontSize: 11, color: C.muted, letterSpacing: 1.5 },
  headerRight:    { flexDirection: 'row', gap: 8 },
  headerIconBtn:  {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.parchment, alignItems: 'center', justifyContent: 'center',
  },

  // Date + hero
  dateLine: {
    fontFamily: 'Inter-SemiBold', fontSize: 11, color: C.saffron,
    letterSpacing: 1.5, marginTop: 12, marginBottom: 6,
  },
  heroLine:   { fontFamily: 'Fraunces-Regular', fontSize: 34, lineHeight: 40, color: C.teal, marginBottom: 24 },
  heroItalic: { fontFamily: 'Fraunces-LightItalic', fontSize: 34, lineHeight: 40, color: C.saffron },

  // Meditation
  meditationSection: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 24, paddingHorizontal: 4,
  },
  meditationButton:   { alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  divaImage:           { width: 46, height: 46, resizeMode: 'contain' },
  meditationGurmukhi: {
    fontFamily: 'NotoSansGurmukhi', fontSize: 13, color: C.ink,
    textAlign: 'center', lineHeight: 18,
  },
  meditationSubtitle: {
    fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted,
    textAlign: 'center', marginTop: 2,
  },

  // Katha card
  kathaCard: {
    backgroundColor: C.parchment, borderRadius: 20, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: C.ivoryDeep,
  },
  sectionLabelRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionLabelLine: { flex: 1, height: 1, backgroundColor: C.ivoryDeep },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold', fontSize: 11, color: C.muted, letterSpacing: 1.5,
  },
  kathaBanner: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden' },
  kathaBannerImage: {
    ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover',
  },
  kathaBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 47, 32, 0.55)',
    padding: 16, justifyContent: 'flex-end',
  },
  kathaBannerTitle: {
    fontFamily: 'Fraunces-SemiBold', fontSize: 22, lineHeight: 28, color: '#FFFFFF',
  },
  kathaDivider: { width: 32, height: 1, backgroundColor: C.gold, marginVertical: 8 },
  kathaBannerAuthor: {
    fontFamily: 'Fraunces-LightItalic', fontSize: 13, lineHeight: 18,
    color: 'rgba(255,255,255,0.85)', marginBottom: 12,
  },
  kathaListenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start',
  },
  kathaListenText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: C.teal },
  kathaMetadata: {
    fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted,
    textAlign: 'center', marginTop: 10, lineHeight: 17,
  },
  kathaVideoTitle: { fontFamily: 'Inter-Medium', fontSize: 12, color: C.ink },

  // About row
  aboutRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 24 },
  aboutCard: {
    backgroundColor: C.parchment, borderRadius: 20,
    paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.ivoryDeep,
  },
  aboutCardText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: C.saffron, textAlign: 'center' },
  linksButton: {
    width: 52, borderRadius: 16,
    backgroundColor: C.parchment, borderWidth: 1, borderColor: C.ivoryDeep,
    alignItems: 'center', justifyContent: 'center',
  },

  // Playlists
  playlistContainer: { marginBottom: 4 },
  playlistHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 12,
  },
  playlistHeader: { fontFamily: 'Fraunces-SemiBold', fontSize: 22, color: C.ink },
  seeAll:         { fontFamily: 'Inter-Medium', fontSize: 13, color: C.saffron },
  playlistRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  playlistCard: {
    backgroundColor: C.parchment, borderRadius: 16,
    borderWidth: 1, borderColor: C.ivoryDeep,
    overflow: 'hidden', width: '48%',
  },
  playlistThumbWrapper: { width: '100%', aspectRatio: 16 / 9 },
  playlistThumbnail:    { width: '100%', height: '100%', resizeMode: 'cover' },
  playlistTitle: {
    fontFamily: 'Inter-Medium', fontSize: 13, color: C.ink,
    textAlign: 'center', padding: 10,
  },

  // Modals shared
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(19,48,46,0.4)', paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: C.parchment, borderRadius: 20, padding: 20,
    width: '88%', alignItems: 'center',
  },
  modalTitle:        { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: C.teal, marginBottom: 4 },
  modalSubtitleText: { fontFamily: 'Inter-Regular', fontSize: 13, color: C.muted, marginBottom: 12 },
  timeText:          { fontFamily: 'Inter-Regular', fontSize: 13, color: C.muted, marginTop: 4 },
  audioControls:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  audioButton:       { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: C.ivoryDeep },
  audioButtonText:   { fontFamily: 'Inter-Medium', fontSize: 14, color: C.ink },

  modalSectionLabel: {
    fontFamily: 'Inter-SemiBold', fontSize: 11, color: C.saffron,
    letterSpacing: 1.2, marginTop: 8, marginBottom: 6,
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.ivory, borderRadius: 14,
    borderWidth: 1, borderColor: C.ivoryDeep,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10,
  },
  linkText: { flex: 1, marginLeft: 10, fontFamily: 'Inter-SemiBold', fontSize: 14, color: C.ink },
  instructions: {
    backgroundColor: C.ivory, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: C.ivoryDeep, marginBottom: 10,
  },
  instructionsItem: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted, marginBottom: 4 },

  // About modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(19,48,46,0.4)',
    paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: C.parchment, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: C.ivoryDeep, width: '92%', alignItems: 'stretch',
  },
  modalBodyWrap:    { flex: 1, minHeight: 0 },
  modalBodyContent: { paddingBottom: 8, flexGrow: 1 },
  modalBody:        { fontFamily: 'Fraunces-Light', fontSize: 15, color: C.ink, lineHeight: 24 },
  closeButton: {
    backgroundColor: C.ivoryDeep, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginTop: 10,
    minHeight: 48, justifyContent: 'center',
  },
  closeButtonText: { fontFamily: 'Inter-SemiBold', color: C.saffron, fontSize: 14 },

  carouselWrap: {
    width: '100%', alignSelf: 'center', marginBottom: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.parchment, borderRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: C.ivoryDeep,
  },
  dots:      { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: C.ivoryDeep },
  dotActive: { backgroundColor: C.saffron },
}); }
