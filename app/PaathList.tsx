import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './_layout';

type PaathListNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'PaathScreen'
>;

export default function PaathList() {
  const navigation = useNavigation<PaathListNavProp>();
  const insets = useSafeAreaInsets();

  const paaths = [
    'ਜਪੁਜੀ ਸਾਹਿਬ | Japji Sahib',
    'ਸੁਖਮਨੀ ਸਾਹਿਬ | Sukhmani Sahib',
    'ਸਲੋਕ ਮਹਲਾ ੯ | Shlok Mahala 9',
    'ਕੀਰਤਨ ਸੋਹਿਲਾ | Kirtan Sohila',
    'ਸ਼ਬਦ ਹਜ਼ਾਰੇ | Shabad Hazare',
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
    'ਭਗਤ ਬਾਣੀ - ਸਲੋਕ ਕਬੀਰ ਜੀ ਕੇ | Bhagat Bani - Salok Kabir Ji ke',
    'ਭਗਤ ਬਾਣੀ - ਸਲੋਕ ਭਗਤ ਫਰੀਦ ਜੀ ਕੇ | Bhagat Bani - Salok Bhagat Fareed Ji ke',
    'ਸਲੋਕ ਸਹਸਕ੍ਰਿਤੀ | Salok Sahaskriti',
    'ਸਵੈਯੇ | Savaiye',
    'ਭਗਤ ਬਾਣੀ | Bhagat Bani',
  ];

  const handlePress = (paathName: string) => {
    if (paathName === 'ਭਗਤ ਬਾਣੀ | Bhagat Bani') {
      navigation.navigate('BhagatBaniList');
    } else {
      navigation.navigate('PaathDetail', { paathName });
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Paath</Text>
        <Text style={styles.eyebrow}>PAATH · NITNEM · GURBANI</Text>
        <Text style={styles.headerGurmukhi}>ਪਾਠ</Text>

        <View style={styles.list}>
          {paaths.map((paath, i) => {
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
                <Ionicons name="chevron-forward" size={16} color={MUTED} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== Theme ===== */
const SAFFRON    = '#E06B1F';
const TEAL       = '#13302E';
const PARCHMENT  = '#FBF6EE';

const IVORY_DEEP = '#F0E6D4';
const INK        = '#1A1612';
const MUTED      = '#6B6054';
const BORDER     = IVORY_DEEP;
const BG         = PARCHMENT;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F1E6' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  eyebrow: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: SAFFRON, letterSpacing: 1.6, marginTop: 0, marginBottom: 4 },
  header: { fontFamily: 'Fraunces-Regular', fontSize: 36, color: TEAL, lineHeight: 40 },
  headerGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 22, color: SAFFRON, marginTop: 4, marginBottom: 20 },

  list: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BG,
    borderRadius: 14, paddingVertical: 14, paddingRight: 14,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  rowAccent: { width: 3, alignSelf: 'stretch', backgroundColor: SAFFRON, borderRadius: 2, marginRight: 12 },
  textWrap: { flex: 1, paddingRight: 8 },
  titleGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 16, color: INK, lineHeight: 24 },
  titleEnglish: { fontFamily: 'NotoSansGurmukhi', fontSize: 12, color: MUTED, marginTop: 2 },
});
