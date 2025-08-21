import React, { useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './_layout';

type PaathListNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'PaathScreen'
>;

export default function PaathList() {
  const navigation = useNavigation<PaathListNavProp>();

  const paaths = [
    'Japji Sahib',
    'Sukhmani Sahib',
    'Shlok Mahala 9',
    'Kirtan Sohila',
    'Shabad Hazare',
    'Anand Sahib',
    'Chaupai Sahib',
    'Rehraas Sahib',
    'Barah Maha Manjh',
    'Aarti',
    'Sidh Gosht',
    'Bavan Akhri',
    'Dakhni Oankar',
    'Dukh Banjani Sahib',
    'Asa Di Vaar',
    'Bhagat Bani',
    'Bai Vaaran',
    'Sahaskriti Shlok',
    'Savaiye',
  ];

  const [query, setQuery] = useState('');
  const [aboutVisible, setAboutVisible] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return paaths;
    return paaths.filter((p) => p.toLowerCase().includes(q));
  }, [query, paaths]);

  const handlePress = (paathName: string) => {
    navigation.navigate('PaathDetail', { paathName });
  };

  return (
    <SafeAreaView
              style={[styles.safeArea, { paddingTop: useSafeAreaInsets().top}]}
              edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header row with About modal trigger */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Paath Collection</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="About this list"
            onPress={() => setAboutVisible(true)}
            style={styles.infoPill}
            activeOpacity={0.85}
          >
            <Text style={styles.infoPillText}>About</Text>
          </TouchableOpacity>
        </View>

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
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <View style={styles.list}>
          {filtered.map((paath, i) => (
            <TouchableOpacity
              key={i}
              style={styles.row}
              onPress={() => handlePress(paath)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open ${paath}`}
            >
              <View style={styles.textWrap}>
                <Text style={styles.title}>{paath}</Text>
                <Text style={styles.hint}>Tap to read</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          ))}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No matches. Try another term.
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
              quickly filter the list. Tap any item to open its details.
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
  container: {
    flex: 1,
    backgroundColor: BG,
    
  },
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
    marginBottom: 14,
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
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  textWrap: {
    flex: 1,
    paddingRight: 10,
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
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

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
