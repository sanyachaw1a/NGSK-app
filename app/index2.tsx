import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import AboutModal from './AboutModal';
import { Audio } from 'expo-av';
import { Modal, Button } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';


const YOUTUBE_API_KEY = 'AIzaSyBtc9BFVigZ0fn6IrugqhVTNk6ikjbMzH8';
const PLAYLIST_ID = 'PL8SWO6yqWeNimurvjsEJp9z1w_roqPbRz';
const CHANNEL_ID = 'UCwhkvqY1koXSP-L-Ke7Y6jQ';

export default function MainScreen() {
  const [latestVideo, setLatestVideo] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [linksModalVisible, setLinksModalVisible] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync();
    fetchLatestVideo();
    checkIfChannelIsLive();

    const interval = setInterval(() => {
      checkIfChannelIsLive();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
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

  async function checkIfChannelIsLive() {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        if (!isLive) {
          Alert.alert('🔴 Live Now', 'In Sahaj Channel is now LIVE. Tap the banner to watch!');
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🔴 We Are LIVE!',
              body: 'In Sahaj Channel is now broadcasting live. Tap to join!',
              sound: 'default',
            },
            trigger: null,
          });
        }
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    } catch (error) {
      console.error('Error checking live status:', error);
    }
  }

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for notifications!');
      }
    } else {
      alert('Must use physical device for Push Notifications');
    }
  }

  async function openYouTubeLink(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert(`Can't open this URL: ${url}`);
    }
  }

  const openLink = (url: string) => {
    Linking.openURL(url);
    setModalVisible(false);
  };
  

  return (
    
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['left', 'right', 'top']}>
      <AboutModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true}>
        
        <TouchableOpacity
          style={isLive ? styles.liveNotificationBar : styles.notificationBar}
          onPress={() => openYouTubeLink('https://www.youtube.com/@Insahaj/live')}
        >
          <Text style={styles.notificationText}>
            {isLive ? '🔴 We Are LIVE Now! Tap to Watch' : '🔔 LIVE Notifications on Sahaj Channel'}
          </Text>
        </TouchableOpacity>

        <View style={styles.quickLinksWrapper}>
        <TouchableOpacity onPress={() => setLinksModalVisible(true)} style={styles.quickLinksButton}>
          <Ionicons name="globe-outline" size={22} color="#4F2613" />
          <Text style={styles.quickLinksText}>Quick Links</Text>
        </TouchableOpacity>
      </View>


        <View style={styles.meditationSection}>
          <MeditationButton
            title="Morning Meditation"
            source={require('../assets/audio/morning-meditation.mp3')}
          />
          <MeditationButton
            title="Om Satnam Simran"
            source={require('../assets/audio/om-satnam-simran.mp3')}
          />
          <MeditationButton
            title={`Naam\nSimran`}
            source={require('../assets/audio/naam-simran.mp3')}
          />
        </View>
        

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Sahaj Katha</Text>
          {latestVideo ? (
            <TouchableOpacity
              style={styles.videoCard}
              onPress={() => openYouTubeLink(`https://www.youtube.com/watch?v=${latestVideo.snippet.resourceId.videoId}`)}
            >
              <Image
                source={{ uri: latestVideo.snippet.thumbnails.medium.url }}
                style={styles.videoThumbnail}
              />
              <Text style={styles.videoTitle}>{latestVideo.snippet.title}</Text>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator size="large" color="#FF9966" />
          )}
        </View>

        <TouchableOpacity style={styles.aboutSection} onPress={() => setModalVisible(true)}>
          <Text style={styles.aboutText}>🧡 About Gurudev Maharaj Ji</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playlists</Text>
          <View style={styles.playlistSection}>
            <PlaylistCard
              title="Divine Wisdom"
              url="https://www.youtube.com/playlist?list=PL8SWO6yqWeNiYAmc8fsuN2K6FHbKIukZl"
              thumbnail="https://i.ytimg.com/vi/Fwfs8m7-aQc/hqdefault.jpg"
            />
            <PlaylistCard
              title="Soulful Kirtan"
              url="https://www.youtube.com/playlist?list=PL8SWO6yqWeNhTf2dqAlH_fBql7s0PJrGL"
              thumbnail="https://i.ytimg.com/vi/WyVWA8ZEjhA/hqdefault.jpg"
            />
          </View>
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={linksModalVisible}
        animationType="fade"
        onRequestClose={() => setLinksModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackground}
          onPressOut={() => setLinksModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🌐 Quick Links</Text>

            <TouchableOpacity onPress={() => openLink('https://whatsapp.com/channel/0029VajldkL2ZjCn7NsymG2M')}>
              <Text style={styles.link}>💬 WhatsApp Broadcast Channel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, marginBottom: 10, textAlign: 'center', color: '#333' }}>
              Click on ‘Follow’ to join the channel. Tap the ‘🔔 Bell Icon’ to turn on notifications. Go to the ‘Updates’ tab at the bottom of your WhatsApp screen to view the channel and all regular updates.
            </Text>

            <TouchableOpacity onPress={() => openLink('https://www.instagram.com/in.sahaj/')}>
              <Text style={styles.link}>📸 Instagram Channel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => openLink('https://www.youtube.com/@Insahaj')}>
              <Text style={styles.link}>▶️ YouTube Channel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function MeditationButton({ title, source }: { title: string; source: any }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1); // prevent div by 0

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
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const handleStop = async () => {
    await sound?.stopAsync();
    await sound?.unloadAsync();
    setSound(null);
    setModalVisible(false);
  };


  return (
    <>
      <TouchableOpacity style={styles.meditationButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.meditationText}>{title}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
      <Pressable
        onPress={() => {
          // Stop and unload sound when clicking outside
          if (sound) {
            sound.stopAsync();
            sound.unloadAsync();
          }
          setSound(null);
          setModalVisible(false);
        }}
        style={styles.modalOverlay}
      >
        <Pressable onPress={() => {}} style={styles.modalContent}>
          <Text style={styles.modalTitleText}>{title}</Text>

          <Slider
            style={styles.audioSlider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#FF9966"
            maximumTrackTintColor="#ccc"
          />
          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>

          <View style={styles.audioControls}>
            <TouchableOpacity style={styles.audioButton} onPress={handlePausePlay}>
              <Text style={styles.audioButtonText}>
                {isPlaying ? '⏸ Pause' : '▶️ Play'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.audioButton} onPress={handleStop}>
              <Text style={[styles.audioButtonText, { color: '#FF4C4C' }]}>🛑 Stop</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>


    </>
  );
}




function PlaylistCard({ title, url, thumbnail }: { title: string; url: string; thumbnail: string }) {
  const handlePress = async () => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert(`Cannot open this URL: ${url}`);
    }
  };

  return (
    <TouchableOpacity style={styles.playlistCard} onPress={handlePress}>
      <Image source={{ uri: thumbnail }} style={styles.playlistThumbnail} />
      <Text style={styles.playlistTitle}>Listen to {title}</Text>
      <Text style={styles.smallText}>Playlist</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    backgroundColor: '#FDFAF5', // Bianca
  },

  // 🔔 Notification Bars
  notificationBar: {
    backgroundColor: '#FDFAF5', // Papaya
    padding: 8,
  },
  liveNotificationBar: {
    backgroundColor: '#FF4C4C', // Alert Red (unchanged)
    padding: 8,
  },
  notificationText: {
    color: '#4F2613', // Bianca for strong contrast
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'OpenSans-Bold',
  },

  // 🧘‍♀️ Meditation Buttons
  meditationSection: {
  marginTop: 16,
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
},

meditationButton: {
  flex: 1,
  marginHorizontal: 4,
  backgroundColor: '#FFFFFF', // clean white background
  paddingVertical: 18,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
  borderWidth: 1,
  borderColor: '#F2F2F2',
},

meditationText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  textAlign: 'center',
},


  // 📺 Section Headers
  section: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFF5EC', // Bianca variant
    borderRadius: 12,
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2E2C2B', // Birch
    fontFamily: 'OpenSans-Bold',
  },

  // 🎥 Latest Video
  videoCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  videoThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    color: '#4F2613', // Cork
    fontFamily: 'NunitoSans-Regular',
  },

  // 🎶 Playlist Cards
  playlistSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playlistCard: {
    backgroundColor: '#8076BE', // Lavender fill instead of border
    padding: 16,
    borderRadius: 16,
    width: '48%',
    alignItems: 'center',
  },
  playlistTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#FDFAF5', // Bianca text
    fontFamily: 'NunitoSans-Regular',
  },
  smallText: {
    fontSize: 11,
    color: '#FDFAF5', // Light text for lavender background
    marginTop: 4,
    fontFamily: 'NunitoSans-Regular',
  },
  playlistThumbnail: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },

  // 🎛️ Audio Modal
  modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.3)',
},

modalContent: {
  backgroundColor: '#FFFFFF', // clean white
  borderRadius: 20,
  padding: 24,
  width: '85%',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},

modalTitleText: {
  fontSize: 18,
  fontWeight: '700',
  color: '#333',
  marginBottom: 12,
  textAlign: 'center',
},

audioSlider: {
  width: '100%',
  marginTop: 12,
},

timeText: {
  fontSize: 13,
  color: '#666',
  marginTop: 4,
},

audioControls: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-around',
  width: '100%',
  marginTop: 20,
},

audioButton: {
  backgroundColor: '#F5F5F5',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
},

audioButtonText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#333',
},


  // 🙏 About Section
  aboutSection: {
    backgroundColor: '#E27528', // Papaya fill instead of left border
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FDFAF5', // Bianca
    fontFamily: 'OpenSans-Bold',
  },
  iconContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: 260,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  link: {
    fontSize: 16,
    marginVertical: 8,
    color: '#007bff',
    textAlign: 'center',
  },
  quickLinksWrapper: {
  alignItems: 'center',
  marginTop: 14,
  marginBottom: 10,
},

quickLinksButton: {
  width: '92%',
  backgroundColor: '#FFFFFF', // pure white card
  paddingVertical: 14,
  borderRadius: 14,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
  borderWidth: 1,
  borderColor: '#F0F0F0', // subtle border for separation
},

quickLinksText: {
  marginLeft: 10,
  fontSize: 15,
  fontWeight: '600',
  color: '#333',
},

  
});

