import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  TextInput,
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

const FAV_KEY = 'paath_favorites_v1';

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
  ];

  const [query, setQuery] = useState('');
  const [aboutVisible, setAboutVisible] = useState(false);

  // ⭐ Favorites state (persisted)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);

  // Load favorites on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAV_KEY);
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          setFavorites(new Set(arr));
        }
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
    const q = query.trim().toLowerCase();
    const base = q ? paaths.filter((p) => p.toLowerCase().includes(q)) : paaths;
    return showOnlyFavs ? base.filter((p) => favorites.has(p)) : base;
  }, [query, paaths, showOnlyFavs, favorites]);

  const handlePress = (paathName: string) => {
    navigation.navigate('PaathDetail', { paathName });
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
      style={[styles.safeArea, { paddingTop: insets.top }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header row with About modal trigger */}
        <Text style={styles.header}>Paath List</Text>
        


        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search paath…"
            placeholderTextColor="#7B76A8"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

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
            const isFav = favorites.has(paath);
            return (
              <View key={i} style={styles.row}>
                <TouchableOpacity
                  style={styles.textWrap}
                  onPress={() => handlePress(paath)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${paath}`}
                >
                  <Text style={styles.title}>{paath}</Text>
                  <Text style={styles.hint}>Tap to read</Text>
                </TouchableOpacity>

                {/* Favorite star */}
                <TouchableOpacity
                  onPress={() => toggleFavorite(paath)}
                  accessibilityRole="button"
                  accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.starHitbox}
                >
                  <Ionicons
                    name={isFav ? 'star' : 'star-outline'}
                    size={22}
                    color={isFav ? PRIMARY : SUBTLE}
                  />
                </TouchableOpacity>

                <Text style={styles.chev}>›</Text>
              </View>
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

      {/* Light-background modal (purple-accented) */}
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

/* ===== Theme (purple, light UI) ===== */
const PRIMARY = '#8076BE';
const BORDER = 'rgba(128, 118, 190, 0.26)';
const BG = '#FFFFFF';
const WASH = '#F5F3FF'; // light purple wash
const TEXT = '#1F2328';
const SUBTLE = '#6B7280';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },

  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  header: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 10,

  },
  infoPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: WASH,
    borderWidth: 1,
    borderColor: BORDER,
  },
  infoPillText: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 12,
  },

  /* Search */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WASH,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
    color: PRIMARY,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  clear: {
    fontSize: 16,
    color: PRIMARY,
    paddingLeft: 4,
  },

  /* Filters */
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F7F6FF',
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterPillActive: {
    backgroundColor: '#ECE8FF',
    borderColor: PRIMARY,
  },
  filterText: {
    color: SUBTLE,
    fontWeight: '700',
    fontSize: 12,
  },
  filterTextActive: {
    color: PRIMARY,
  },

  /* List */
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  textWrap: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
    color: PRIMARY,
  },
  starHitbox: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 10,
  },
  chev: {
    fontSize: 24,
    lineHeight: 24,
    color: PRIMARY,
  },

  /* Empty state */
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WASH,
  },
  emptyText: {
    color: SUBTLE,
    fontSize: 14,
  },

  /* Modal — light background with purple accents */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FBFAFF', // extra-light
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    color: SUBTLE,
  },
  modalCloseBtn: {
    backgroundColor: '#ECE8FF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalCloseText: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },
});
