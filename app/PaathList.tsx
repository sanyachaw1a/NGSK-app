import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './_layout';

type PaathListNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'PaathScreen'
>;

const FAV_KEY       = 'paath_favorites_v1';
const BOOKMARKS_KEY = 'paath_bookmarks_v1';

export default function PaathList() {
  const navigation = useNavigation<PaathListNavProp>();
  const insets = useSafeAreaInsets();

  const paaths = [
    'ਜਪੁਜੀ ਸਾਹਿਬ | Japji Sahib',
    'ਸੁਖਮਨੀ ਸਾਹਿਬ | Sukhmani Sahib',
    'ਸਲੋਕ ਮਹਲਾ ੯ | Shlok Mahala 9',
    'ਕੀਰਤਨ ਸੋਹਿਲਾ | Kirtan Sohila',
    'ਸ਼ਬਦ ਹਜ਼ਾਰੇ | Shabad Hazare',
    'ਆਨੰਦ ਸਾਹਿਬ | Anand Sahib',
    'ਚੌਪਈ ਸਾਹਿਬ | Chaupai Sahib',
    'ਰਹਿਰਾਸ ਸਾਹਿਬ | Rehraas Sahib',
    'ਬਾਰਹ ਮਾਹਾ ਮਾਂਝ | Barah Maha Manjh',
    'ਆਰਤੀ | Aarti',
    'ਸਿਧ ਗੋਸਟਿ | Sidh Gosht',
    'ਬਾਵਨ ਅਖਰੀ | Bavan Akhri',
    'ਦਖਣੀ ਓਅੰਕਾਰੁ | Dakhni Oankar',
    'ਦੁਖ ਭੰਜਨੀ ਸਾਹਿਬ | Dukh Banjani Sahib',
    'ਆਸਾ ਦੀ ਵਾਰ | Asa Di Vaar',
    'ਭਗਤ ਬਾਣੀ | Bhagat Bani',
  ];

  const [aboutVisible, setAboutVisible] = useState(false);

  // ⭐ Favorites state (persisted)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);

  // 🔖 Bookmarks from PaathDetail
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Load favorites and bookmarks on mount
  useEffect(() => {
    (async () => {
      try {
        const [rawFav, rawBook] = await Promise.all([
          AsyncStorage.getItem(FAV_KEY),
          AsyncStorage.getItem(BOOKMARKS_KEY),
        ]);
        if (rawFav)  setFavorites(new Set(JSON.parse(rawFav)));
        if (rawBook) setBookmarks(new Set(JSON.parse(rawBook)));
      } catch {}
    })();
  }, []);

  // Persist favorites whenever they change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favorites)));
      } catch {}
    })();
  }, [favorites]);

  const filtered = useMemo(() => {
    return showOnlyFavs ? paaths.filter((p) => favorites.has(p)) : paaths;
  }, [paaths, showOnlyFavs, favorites]);

  const handlePress = (paathName: string) => {
    if (paathName === 'ਭਗਤ ਬਾਣੀ | Bhagat Bani') {
      navigation.navigate('BhagatBaniList');
    } else {
      navigation.navigate('PaathDetail', { paathName });
    }
  };

  const toggleFavorite = (name: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.eyebrow}>PAATH · NITNEM · GURBANI</Text>
        <Text style={styles.header}>Paath</Text>
        <Text style={styles.headerGurmukhi}>ਪਾਠ</Text>
        


        {/* Filter pills: All / Favorites */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterPill, !showOnlyFavs && styles.filterPillActive]}
            onPress={() => setShowOnlyFavs(false)}
            accessibilityLabel="Show all paaths"
          >
            <Text style={[styles.filterText, !showOnlyFavs && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, showOnlyFavs && styles.filterPillActive]}
            onPress={() => setShowOnlyFavs(true)}
            accessibilityLabel="Show favorite paaths"
          >
            <Ionicons
              name={showOnlyFavs ? 'star' : 'star-outline'}
              size={14}
              color={showOnlyFavs ? PRIMARY : SUBTLE}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.filterText, showOnlyFavs && styles.filterTextActive]}>Favorites</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.list}>
          {filtered.map((paath, i) => {
            const isFav      = favorites.has(paath);
            const isBookmark = bookmarks.has(paath);
            const parts = paath.split(' | ');
            const gurmukhiTitle = parts[0] || paath;
            const englishTitle  = parts[1] || '';
            return (
              <TouchableOpacity
                key={i}
                style={styles.row}
                onPress={() => handlePress(paath)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Open ${paath}`}
              >
                <View style={styles.rowAccent} />
                <View style={styles.textWrap}>
                  <Text style={styles.titleGurmukhi}>{gurmukhiTitle}</Text>
                  {!!englishTitle && <Text style={styles.titleEnglish}>{englishTitle}</Text>}
                </View>

                {isBookmark && (
                  <Ionicons name="bookmark" size={16} color={SAFFRON} style={{ marginRight: 6 }} />
                )}

                <TouchableOpacity
                  onPress={() => toggleFavorite(paath)}
                  accessibilityRole="button"
                  accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.starHitbox}
                >
                  <Ionicons
                    name={isFav ? 'star' : 'star-outline'}
                    size={20}
                    color={isFav ? PRIMARY : SUBTLE}
                  />
                </TouchableOpacity>

                <Ionicons name="chevron-forward" size={16} color={MUTED} />
              </TouchableOpacity>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {showOnlyFavs ? 'No favorites yet.' : 'No matches. Try another term.'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* About modal */}
      <Modal
        visible={aboutVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>About this list</Text>
            <Text style={styles.modalBody}>
              Browse commonly read Nitnem and other paaths. Use the search bar to
              quickly filter the list. Tap any item to open its details. You can also
              tap the star icon to mark a paath as a favorite and filter to view only favorites.
            </Text>

            <Pressable style={styles.modalCloseBtn} onPress={() => setAboutVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ===== Theme ===== */
const SAFFRON    = '#E06B1F';
const TEAL       = '#13302E';
const IVORY      = '#F8F1E6';
const PARCHMENT  = '#FBF6EE';
const IVORY_DEEP = '#F0E6D4';
const INK        = '#1A1612';
const MUTED      = '#6B6054';
const PRIMARY    = SAFFRON;
const BORDER     = IVORY_DEEP;
const BG         = PARCHMENT;
const WASH       = IVORY;
const TEXT       = INK;
const SUBTLE     = MUTED;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  eyebrow: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: SAFFRON, letterSpacing: 1.6, marginTop: 16, marginBottom: 4 },
  header: { fontFamily: 'Fraunces-Regular', fontSize: 36, color: TEAL, lineHeight: 40 },
  headerGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 22, color: SAFFRON, marginTop: 4, marginBottom: 20 },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  infoPill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: WASH, borderWidth: 1, borderColor: BORDER },
  infoPillText: { color: PRIMARY, fontFamily: 'Inter-SemiBold', fontSize: 12 },

  /* Filters */
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: WASH, borderWidth: 1, borderColor: BORDER,
  },
  filterPillActive: { backgroundColor: IVORY_DEEP, borderColor: SAFFRON },
  filterText: { color: SUBTLE, fontFamily: 'Inter-SemiBold', fontSize: 12 },
  filterTextActive: { color: SAFFRON },

  /* List */
  list: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BG,
    borderRadius: 14, paddingVertical: 14, paddingRight: 14,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  rowAccent: { width: 3, alignSelf: 'stretch', backgroundColor: SAFFRON, borderRadius: 2, marginRight: 12 },
  textWrap: { flex: 1, paddingRight: 8 },
  titleGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 16, color: INK, lineHeight: 24 },
  titleEnglish: { fontFamily: 'Inter-Regular', fontSize: 12, color: MUTED, marginTop: 2 },
  title: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: TEXT },
  hint: { fontSize: 12, marginTop: 2, color: MUTED, fontFamily: 'Inter-Regular' },
  starHitbox: { paddingHorizontal: 6, paddingVertical: 4, marginRight: 8, borderRadius: 10 },
  chev: { fontSize: 24, lineHeight: 24, color: MUTED },

  /* Empty state */
  empty: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 24,
    borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: WASH,
  },
  emptyText: { color: SUBTLE, fontSize: 14, fontFamily: 'Inter-Regular' },

  /* Modal */
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: BG, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: BORDER },
  modalTitle: { fontSize: 18, fontFamily: 'Fraunces-Regular', color: TEAL, marginBottom: 8 },
  modalBody: { fontSize: 14, lineHeight: 20, color: SUBTLE, fontFamily: 'Inter-Regular' },
  modalCloseBtn: {
    backgroundColor: IVORY_DEEP, borderRadius: 12, paddingVertical: 10,
    alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: BORDER,
  },
  modalCloseText: { color: TEAL, fontFamily: 'Inter-SemiBold', fontSize: 14 },
});
