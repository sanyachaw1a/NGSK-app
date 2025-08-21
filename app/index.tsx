import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AboutModal from './AboutModal';
import { Image, /* ... */ ImageSourcePropType } from 'react-native';

// --- API Keys & Playlist Info ---
const YOUTUBE_API_KEY = 'AIzaSyBtc9BFVigZ0fn6IrugqhVTNk6ikjbMzH8';
const PLAYLIST_ID = 'PL8SWO6yqWeNimurvjsEJp9z1w_roqPbRz';

function PlaylistCard({ title, url, thumbnail }: { title: string; url: string; thumbnail: ImageSourcePropType }) {
  const handlePress = async () => {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const supported = await Linking.canOpenURL(normalized);
    supported ? Linking.openURL(normalized) : alert(`Cannot open this URL: ${normalized}`);
  };

  return (
    <TouchableOpacity style={styles.playlistCard} onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.playlistThumbWrapper}>
        <Image source={thumbnail} style={styles.playlistThumbnail} />
      </View>
      <Text style={styles.playlistTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

// --- Meditation Button Component ---
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
  const [aboutVisible, setAboutVisible] = useState(false);

  // Social links modal
  const [socialVisible, setSocialVisible] = useState(false);

  useEffect(() => {
    fetchLatestVideo();
  }, []);

  async function fetchLatestVideo() {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=1&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        setLatestVideo(data.items[0]);
      }
    } catch (error) {
      console.error('Error fetching latest video:', error);
    }
  }

  function openUrlNormalized(url: string) {
    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.canOpenURL(finalUrl).then((supported) => {
      supported ? Linking.openURL(finalUrl) : alert(`Can't open this URL: ${finalUrl}`);
    });
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top}]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ right: 1, bottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Meditation Buttons */}
        <View style={styles.meditationSection}>
          <MeditationButton
            title="Amrit Vela Meditation"
            source={require('../assets/audio/morning-meditation.mp3')}
            icon="sunny-outline"
          />
          <MeditationButton
            title="Om Satnam Meditation"
            source={require('../assets/audio/om-satnam-simran.mp3')}
            icon="musical-notes-outline"
          />
          <MeditationButton
            title="Mool Mantra Meditation"
            source={require('../assets/audio/naam-simran.mp3')}
            icon="infinite-outline"
          />
        </View>

        {/* About + Important Links row */}
        <View style={styles.aboutRow}>
          <TouchableOpacity style={[styles.aboutCard, { flex: 1 }]} onPress={() => setAboutVisible(true)}>
            <Text style={styles.aboutCardText}>🧡 About Gurudev Maharaj Ji</Text>
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
        <Text style={styles.kathaTitle}>Latest Sahaj Katha</Text>
        {latestVideo ? (
          <TouchableOpacity
            onPress={() => openUrlNormalized(`https://www.youtube.com/watch?v=${latestVideo.snippet.resourceId.videoId}`)}
            activeOpacity={0.9}
          >
            <View style={styles.kathaThumbWrapper}>
              <Image source={require('../assets/images/sahaj-katha.jpg')} style={styles.kathaThumbnail} />
            </View>
            <Text style={styles.kathaVideoTitle}>{latestVideo.snippet.title}</Text>
          </TouchableOpacity>
        ) : (
          <ActivityIndicator size="large" color="#E27528" />
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

      {/* Social Links Modal (uses safe-area padding) */}
      <Modal visible={socialVisible} animationType="fade" transparent>
        <Pressable
          onPress={() => setSocialVisible(false)}
          style={[styles.modalOverlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}
        >
          <Pressable onPress={() => {}} style={[styles.modalContent, { alignItems: 'stretch' }]}>
            <Text style={styles.modalTitle}>Stay Connected</Text>

            <Text style={styles.modalSubtitle}>WhatsApp Broadcast Channel</Text>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => openUrlNormalized('https://whatsapp.com/channel/0029VajldkL2ZjCn7NsymG2M')}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#E27528" />
              <Text style={styles.linkText}>Open WhatsApp Channel</Text>
              <Ionicons name="chevron-forward" size={18} color="#E27528" />
            </TouchableOpacity>

            <View style={styles.instructions}>
              <Text style={styles.instructionsItem}>• Click on ‘Follow’ to join the channel.</Text>
              <Text style={styles.instructionsItem}>• Tap the ‘🔔 Bell Icon’ to turn on notifications.</Text>
              <Text style={styles.instructionsItem}>
                • Go to the ‘Updates’ tab at the bottom of your WhatsApp screen to view the channel and all regular
                updates.
              </Text>
            </View>

            <Text style={styles.modalSubtitle}>Instagram</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => openUrlNormalized('https://www.instagram.com/in.sahaj/')}>
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

      <AboutModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        image={require('../assets/images/maharaj-ji.jpg')}
        title="About Gurudev Maharaj Ji"
        content={`Brahmgyani Mahant Baba Ram Singh Ji Maharaj is the Current Spiritual Head of Nirmal Ashram, Rishikesh—a spiritual sanctuary that welcomes all seekers and embodies the principle of ‘Love All, Serve All’.

Maharaj Ji is a Brahmgyani—a fully enlightened being—whose life is dedicated to guiding humanity toward its highest purpose: Self-realisation. 

He is a pure manifestation of the Divine—imparting the fundamental truth: there is one God.

At the heart of Maharaj Ji's teachings lies an emphasis on prema bhakti—wholehearted, sincere love for God, alongside the principles of nishkam sewa—selfless service and naam simran—constant meditative remembrance of the Lord.

His teachings inspire us to serve everyone, embracing oneness and compassion as guiding principles on the path towards spiritual growth and the ultimate goal of human life: enlightenment, recognising oneself as the witness self, and thus finding liberation from the cycle of birth and death (moksha).

Maharaj Ji embraces all beings as manifestations of the One Lord, recognising the divine presence within each individual.

His eyes and entire being radiate love. Mercy is his very nature, and his heart brims with boundless compassion for all beings.

To contemplate, meditate upon, and receive the blessings of such a saint is to invite purity, inspiration, and divine consciousness into one's life.

ਐਸਾ ਗੁਰੁ ਵਡਭਾਗੀ ਪਾਇਆ ॥੧॥
ऐसा गुरु वडभागी पाइआ ॥१॥
Aesaa gur vadbhaagee paayaa. ||1||
Such a Guru is found by great good fortune. ||1||
Sri Guru Granth Sahib Ji, Ang 803 (GuruArjan Dev Ji in Raag Bilawal)
  `}
      />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {  paddingHorizontal: 10 },

  // Meditation Buttons
  meditationSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  meditationButton: { alignItems: 'center', width: 90 },
  iconCircle: {
    backgroundColor: '#FFF6F0',
    borderRadius: 50,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD9B3',
    marginBottom: 8,
  },
  meditationText: { fontSize: 12, fontWeight: '500', color: '#333', textAlign: 'center' },

  // Modal (shared)
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    width: '85%', alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },

  // Audio modal bits
  timeText: { fontSize: 13, color: '#666', marginTop: 4 },
  audioControls: { flexDirection: 'row', gap: 10, marginTop: 20 },
  audioButton: {
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  audioButtonText: { fontSize: 14, fontWeight: '500' },

  // About + Links row
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
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
    width: 52,
    borderRadius: 16,
    backgroundColor: '#FFF6F0',
    borderWidth: 1,
    borderColor: '#FFD9B3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Katha Card
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
  kathaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E27528',
    textAlign: 'center',
    marginBottom: 10,
  },
  kathaThumbnail: {
  width: '100%',
  height: '100%',
  // choose one:
  resizeMode: 'cover',     // fills frame; may crop a bit (nice look)
  // resizeMode: 'contain', // no crop; may letterbox
},
  kathaVideoTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },

  // Playlists
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
  playlistThumbnail: {
  width: '100%',
  height: '100%',
  // choose one:
  resizeMode: 'cover',
  // resizeMode: 'contain',
},
  playlistTitle: { fontSize: 13, fontWeight: '500', color: '#333', textAlign: 'center' },

  // Social modal link rows
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E27528',
    marginTop: 6,
    marginBottom: 6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD9B3',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  linkText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  instructions: {
    backgroundColor: '#FFFAF5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFE7CC',
    marginBottom: 10,
  },
  kathaThumbWrapper: {
  width: '100%',
  aspectRatio: 16 / 9,     // consistent ratio across devices
  borderRadius: 14,
  overflow: 'hidden',
},

playlistThumbWrapper: {
  width: '100%',
  aspectRatio: 16 / 9,     // use same ratio for thumbnails
  borderRadius: 12,
  overflow: 'hidden',
},
  instructionsItem: { fontSize: 12, color: '#555', marginBottom: 4 },
});
