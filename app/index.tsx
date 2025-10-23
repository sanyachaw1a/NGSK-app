// index.tsx
import { useEffect, useRef, useState } from 'react';
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
import { Linking } from 'react-native';  // <-- use RN Linking
import * as WebBrowser from 'expo-web-browser';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';



// Foreground notifications behavior
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
  videoId?: string;
  playlistId?: string;
  channelId?: string;
  url?: string;
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

  // Try YouTube app
  try {
    if (appUrl) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {
    /* fall back to web */
  }

  // Fallback to in-app browser, then system
  if (webUrl) {
    try { await WebBrowser.openBrowserAsync(webUrl); return; } catch {}
    try { await Linking.openURL(webUrl); } catch {}
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

// --- API Keys & Channel/Playlist Info ---
const YOUTUBE_API_KEY = 'AIzaSyBtc9BFVigZ0fn6IrugqhVTNk6ikjbMzH8';
const PLAYLIST_ID = 'PL8SWO6yqWeNimurvjsEJp9z1w_roqPbRz';
const CHANNEL_ID = 'UCwhkvqY1koXSP-L-Ke7Y6jQ';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ---------- Components ----------
function PlaylistCard({ title, url, thumbnail }: { title: string; url: string; thumbnail: ImageSourcePropType }) {
  const handlePress = async () => openSmartUrl(url);
  return (
    <TouchableOpacity style={styles.playlistCard} onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.playlistThumbWrapper}>
        <Image source={thumbnail} style={styles.playlistThumbnail} />
      </View>
      <Text style={styles.playlistTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

function MeditationButton({ title, source, icon }: { title: string; source: any; icon: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const insets = useSafeAreaInsets();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    if (modalVisible) {
      (async () => {
        const { sound: newSound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 1);
          setIsPlaying(status.isPlaying);
        });
        setSound(newSound);
      })();
    }
    return () => {
      sound?.unloadAsync();
      setSound(null);
    };
  }, [modalVisible]);

  const handlePausePlay = async () => {
    if (!sound) return;
    isPlaying ? await sound.pauseAsync() : await sound.playAsync();
  };

  const handleSeek = async (value: number) => {
    if (sound) await sound.setPositionAsync(value);
  };

  const handleStop = async () => {
    await sound?.stopAsync();
    await sound?.unloadAsync();
    setSound(null);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.meditationButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon as any} size={26} color="#E27528" />
        </View>
        <Text style={styles.meditationText}>{title}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable
          onPress={handleStop}
          style={[styles.modalOverlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}
        >
          <Pressable onPress={() => {}} style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>

            <Slider
              style={{ width: '90%', marginTop: 12 }}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={handleSeek}
              minimumTrackTintColor="#E27528"
              maximumTrackTintColor="#ccc"
            />
            <Text style={styles.timeText}>
              {formatTime(position)} / {formatTime(duration)}
            </Text>

            <View style={styles.audioControls}>
              <TouchableOpacity style={styles.audioButton} onPress={handlePausePlay}>
                <Text style={styles.audioButtonText}>{isPlaying ? '⏸ Pause' : '▶️ Play'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.audioButton, { backgroundColor: '#FFD9B3' }]} onPress={handleStop}>
                <Text style={[styles.audioButtonText, { color: '#E27528' }]}>🛑 Stop</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// --- MainScreen ---
export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const [latestVideo, setLatestVideo] = useState<any>(null);
  const [socialVisible, setSocialVisible] = useState(false);
  const didSetAudioMode = useRef(false);


  // ===== About Nirmal Ashram modal state + carousel sizing =====
  const [nirmalVisible, setNirmalVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const [displayW, setDisplayW] = useState(screenWidth * 0.92); // sensible default
  const [displayH, setDisplayH] = useState(Math.round((screenWidth * 9) / 16));
  const scrollRef = useRef<ScrollView>(null);

  // If you add more images later, just add another require() here.
  const nirmalImages = [
    require('../assets/images/about-1.jpeg'),
    require('../assets/images/about-2.jpeg'),
    require('../assets/images/about-3.jpeg'),
    // require('../assets/images/about-4.jpeg'),
    // require('../assets/images/about-5.jpeg'),
  ];

  // 🔔 live-detection state
  const [isLive, setIsLive] = useState(false);
  const [hasAlertedForThisLive, setHasAlertedForThisLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🔔 Ask for notification permission once
  const didInitAudio = useRef(false);
  useEffect(() => {
    if (didInitAudio.current) return;
    didInitAudio.current = true;

    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,          // <-- critical for Android/iOS
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn('Failed to set audio mode', e);
      }
    })();
  }, []);


  // Initial fetch for “Latest Sahaj Katha”
  useEffect(() => {
    fetchLatestVideo();
  }, []);

  // Keep your PLAYLIST_ID or CHANNEL_ID constants

async function fetchLatestVideo() {
  // Try Data API first only if you still want it (optional)
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
        });
        return;
      }
    }
  } catch { /* fall through to RSS */ }

  // 🔑 No-key RSS (reliable in standalone Android)
  try {
    const rss = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`);
    const xml = await rss.text();
    // Grab first <entry>
    const entry = xml.split('<entry>')[1];
    const id = entry?.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
    const title = entry?.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    if (id && title) {
      setLatestVideo({ id, title });
      return;
    }
  } catch { /* ignore */ }

  // Final fallback: channel feed
  try {
    const rss = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`);
    const xml = await rss.text();
    const entry = xml.split('<entry>')[1];
    const id = entry?.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
    const title = entry?.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    if (id && title) {
      setLatestVideo({ id, title });
      return;
    }
  } catch {}

  // If we reach here, show a friendly error (so it doesn't spin forever)
  setLatestVideo(null);
}


  // 🔔 Poll YouTube for live status every 60s while app is active
  useEffect(() => {
    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(checkLiveAndNotify, 60000);
      checkLiveAndNotify();
    };
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    const handleAppState = (state: string) => {
      if (state === 'active') startPolling();
      else stopPolling();
    };
    startPolling();
    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
      stopPolling();
    };
  }, []);

  async function checkLiveAndNotify() {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      const goingLive = Array.isArray(json.items) && json.items.length > 0;
      setIsLive(goingLive);

      if (goingLive) {
        const live = json.items[0];
        const liveVideoId = live.id?.videoId as string | undefined;
        const liveTitle = live.snippet?.title || 'Sahaj Katha is live';
        if (!hasAlertedForThisLive && liveVideoId) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🔴 Sahaj Katha is LIVE',
              body: liveTitle,
              data: { url: `https://www.youtube.com/watch?v=${liveVideoId}` },
            },
            trigger: null,
          });
          setHasAlertedForThisLive(true);
        }
      } else {
        if (hasAlertedForThisLive) setHasAlertedForThisLive(false);
      }
    } catch (e) {
      console.warn('Live check failed', e);
    }
  }

  // ===== Carousel sizing/scroll handlers =====
  const onCarouselLayout = (e: any) => {
    const w = e?.nativeEvent?.layout?.width ?? screenWidth * 0.92;
    // Height chosen to avoid cropping and fit into modal: 16:9, capped by card height
    const CARD_H = Math.min(Math.round(screenHeight * 0.82), 720);
    const h = Math.min(Math.round((w * 9) / 16), Math.round(CARD_H * 0.45));
    setDisplayW(w);
    setDisplayH(h);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: (slide || 0) * w, y: 0, animated: false });
    });
  };

  const onCarouselScroll = (e: any) => {
    const x = e?.nativeEvent?.contentOffset?.x ?? 0;
    const i = Math.round(x / Math.max(displayW, 1));
    if (i !== slide) setSlide(i);
  };

  // Fixed card height so the content area gets space (prevents "only title + close" issue)
  const CARD_HEIGHT = Math.min(Math.round(screenHeight * 0.82), 720);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ right: 1, bottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Meditation Buttons */}
        <View style={styles.meditationSection}>
          <MeditationButton title="ਸਤਿਨਾਮ ਵਾਹਿਗੁਰੂ ਦਾ ਸਿਮਰਨ" source={require('../assets/audio/Satnam-Waheguru-MJ.mp3')} icon="musical-notes-outline" />
          <MeditationButton title="ਮੂਲ ਮੰਤਰ ਦਾ ਜਾਪ" source={require('../assets/audio/naam-simran.mp3')} icon="sunny-outline" />
          <MeditationButton title="ਓਮ ਸਤਿਨਾਮੁ ਦਾ ਸਿਮਰਨ" source={require('../assets/audio/om-satnam-simran.mp3')} icon="musical-notes-outline" />
        </View>

        {/* About + Important Links row */}
        <View style={styles.aboutRow}>
          <TouchableOpacity style={[styles.aboutCard, { flex: 1 }]} onPress={() => setNirmalVisible(true)}>
            <Text style={styles.aboutCardText}>About Nirmal Ashram Rishikesh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linksButton}
            onPress={() => setSocialVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open important links"
          >
            <Ionicons name="link-outline" size={20} color="#E27528" />
          </TouchableOpacity>
        </View>

        {/* Latest Sahaj Katha */}
        <View style={styles.kathaCard}>
        <Text style={styles.kathaTitle}>{isLive ? '🔴 Live Now: Sahaj Katha' : 'Latest Sahaj Katha'}</Text>

        {latestVideo ? (
          <TouchableOpacity
            onPress={() => openSmartUrl(`https://www.youtube.com/playlist?list=PL8SWO6yqWeNimurvjsEJp9z1w_roqPbRz`)}
            activeOpacity={0.9}
          >
            <View style={styles.kathaThumbWrapper}>
              <Image source={require('../assets/images/sahaj-katha.jpg')} style={styles.kathaThumbnail} />
            </View>
            <Text style={styles.kathaVideoTitle}>{latestVideo.title}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <ActivityIndicator size="large" color="#E27528" />
            <Text style={{ marginTop: 8, color: '#E27528', fontWeight: '600' }}>
              Loading latest katha…
            </Text>
            <TouchableOpacity onPress={fetchLatestVideo} style={[styles.audioButton, { marginTop: 10 }]}>
              <Text style={styles.audioButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>


        {/* Playlists */}
        <View style={styles.playlistContainer}>
          <Text style={styles.playlistHeader}>Playlists</Text>
          <View style={styles.playlistRow}>
            <PlaylistCard
              title="Divine Wisdom"
              url="https://www.youtube.com/playlist?list=PL8SWO6yqWeNiYAmc8fsuN2K6FHbKIukZl"
              thumbnail={require('../assets/images/divine-wisdom.jpg')}
            />
            <PlaylistCard
              title="Soulful Kirtan"
              url="https://www.youtube.com/playlist?list=PL8SWO6yqWeNhTf2dqAlH_fBql7s0PJrGL"
              thumbnail={require('../assets/images/soulful-kirtan.jpg')}
            />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Social Links Modal */}
      <Modal visible={socialVisible} animationType="fade" transparent>
        <Pressable
          onPress={() => setSocialVisible(false)}
          style={[styles.modalOverlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}
        >
          <Pressable onPress={() => {}} style={[styles.modalContent, { alignItems: 'stretch' }]}>
            <Text style={styles.modalTitle}>Stay Connected</Text>

            <Text style={styles.modalSubtitle}>WhatsApp Broadcast Channel</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => openSmartUrl('https://whatsapp.com/channel/0029VajldkL2ZjCn7NsymG2M')}>
              <Ionicons name="logo-whatsapp" size={20} color="#E27528" />
              <Text style={styles.linkText}>Open WhatsApp Channel</Text>
              <Ionicons name="chevron-forward" size={18} color="#E27528" />
            </TouchableOpacity>

            <View style={styles.instructions}>
              <Text style={styles.instructionsItem}>• Click on ‘Follow’ to join the channel.</Text>
              <Text style={styles.instructionsItem}>• Tap the ‘🔔 Bell Icon’ to turn on notifications.</Text>
              <Text style={styles.instructionsItem}>• Go to the ‘Updates’ tab at the bottom of your WhatsApp screen to view the channel and all regular updates.</Text>
            </View>

            <Text style={styles.modalSubtitle}>Instagram</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => openSmartUrl('https://www.instagram.com/in.sahaj/')}>
              <Ionicons name="logo-instagram" size={20} color="#E27528" />
              <Text style={styles.linkText}>@in.sahaj</Text>
              <Ionicons name="chevron-forward" size={18} color="#E27528" />
            </TouchableOpacity>

            <Text style={styles.modalSubtitle}>YouTube</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => openUrlNormalized('https://www.youtube.com/@Insahaj')}>
              <Ionicons name="logo-youtube" size={20} color="#E27528" />
              <Text style={styles.linkText}>youtube.com/@Insahaj</Text>
              <Ionicons name="chevron-forward" size={18} color="#E27528" />
            </TouchableOpacity>

            <Pressable style={[styles.audioButton, { marginTop: 14 }]} onPress={() => setSocialVisible(false)}>
              <Text style={styles.audioButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===== About Nirmal Ashram Modal (carousel + full text, images not cropped) ===== */}
      <Modal visible={nirmalVisible} transparent animationType="slide" onRequestClose={() => setNirmalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { height: CARD_HEIGHT }]}>
            <Text style={styles.modalTitle} maxFontSizeMultiplier={2.2}>
              About Nirmal Ashram Rishikesh
            </Text>

            <View style={styles.modalBodyWrap}>
              <ScrollView contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator>
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
                        style={{ width: displayW, height: displayH }}
                        resizeMode="contain" // show full image without cropping
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

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: 10 },

  meditationSection: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, alignItems: 'center' },
  meditationButton: { alignItems: 'center', width: 90, marginHorizontal: screenWidth * 0.05 },
  iconCircle: {
    backgroundColor: '#FFF6F0',
    borderRadius: 50,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD9B3',
    marginBottom: 8,
  },
  meditationText: { fontSize: 12, fontWeight: '500', color: '#333', textAlign: 'center' },

  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '85%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },

  timeText: { fontSize: 13, color: '#666', marginTop: 4 },
  audioControls: { flexDirection: 'row', gap: 10, marginTop: 20 },
  audioButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#F5F5F5' },
  audioButtonText: { fontSize: 14, fontWeight: '500' },

  aboutRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  aboutCard: {
    backgroundColor: '#FFF6F0',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD9B3',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  aboutCardText: { fontSize: 15, fontWeight: '600', color: '#E27528', textAlign: 'center' },
  linksButton: {
    width: 52, borderRadius: 16, backgroundColor: '#FFF6F0', borderWidth: 1, borderColor: '#FFD9B3',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  kathaCard: {
    backgroundColor: '#FFF6F0',
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFD9B3',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kathaTitle: { fontSize: 16, fontWeight: '700', color: '#E27528', textAlign: 'center', marginBottom: 10 },
  kathaThumbWrapper: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden' },
  kathaThumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },
  kathaVideoTitle: { fontSize: 13, fontWeight: '500', color: '#333', textAlign: 'center', marginTop: 8 },

  playlistContainer: { marginTop: 20, marginHorizontal: 16 },
  playlistHeader: { fontSize: 16, fontWeight: '700', color: '#E27528', marginBottom: 12 },
  playlistRow: { flexDirection: 'row', justifyContent: 'space-between' },
  playlistCard: {
    backgroundColor: '#FFF6F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD9B3',
    padding: 10,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  playlistThumbWrapper: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' },
  playlistThumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },
  playlistTitle: { fontSize: 13, fontWeight: '500', color: '#333', textAlign: 'center' },

  modalSubtitle: { fontSize: 14, fontWeight: '700', color: '#E27528', marginTop: 6, marginBottom: 6 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF6F0',
    borderRadius: 14, borderWidth: 1, borderColor: '#FFD9B3', paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10,
  },
  linkText: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#333' },
  instructions: { backgroundColor: '#FFFAF5', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#FFE7CC', marginBottom: 10 },
  instructionsItem: { fontSize: 12, color: '#555', marginBottom: 4 },

  /* ====== Nirmal Modal Styles ====== */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFD9B3',
    width: '92%',
    alignItems: 'stretch',
  },
  modalBodyWrap: { flex: 1, minHeight: 0 },
  modalBodyContent: { paddingBottom: 8, flexGrow: 1 },
  modalBody: { fontSize: 15, color: '#363A2B', lineHeight: 22 },

  closeButton: {
    backgroundColor: '#FFE7CC',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  closeButtonText: { color: '#E27528', fontWeight: '700', fontSize: 14 },

  carouselWrap: {
    width: '100%',
    alignSelf: 'center',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE7CC',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.15)' },
  dotActive: { backgroundColor: '#E27528' },
});
