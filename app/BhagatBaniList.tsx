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

type BhagatBaniNavProp = NativeStackNavigationProp<RootStackParamList, 'BhagatBaniList'>;

const ENTRIES: { gurmukhi: string; english: string; paathName: string }[] = [
  { gurmukhi: 'ਰਾਗੁ ਸਿਰੀਰਾਗੁ',              english: 'Raag Sireeraag',       paathName: 'ਰਾਗੁ ਸਿਰੀਰਾਗੁ | Raag Sireeraag' },
  { gurmukhi: 'ਰਾਗੁ ਗਉੜੀ',                  english: 'Raag Gaudi',            paathName: 'ਰਾਗੁ ਗਉੜੀ | Raag Gaudi' },
  { gurmukhi: 'ਰਾਗੁ ਆਸਾ',                    english: 'Raag Aasaa',            paathName: 'ਰਾਗੁ ਆਸਾ | Raag Aasaa' },
  { gurmukhi: 'ਰਾਗੁ ਗੂਜਰੀ',                  english: 'Raag Goojree',          paathName: 'ਰਾਗੁ ਗੂਜਰੀ | Raag Goojree' },
  { gurmukhi: 'ਰਾਗੁ ਸੋਰਠਿ',                  english: 'Raag Sorath',           paathName: 'ਰਾਗੁ ਸੋਰਠਿ | Raag Sorath' },
  { gurmukhi: 'ਰਾਗੁ ਧਨਾਸਰੀ',                 english: 'Raag Dhanaasree',       paathName: 'ਰਾਗੁ ਧਨਾਸਰੀ | Raag Dhanaasree' },
  { gurmukhi: 'ਰਾਗੁ ਜੈਤਸਰੀ',                 english: 'Raag Jaethsree',        paathName: 'ਰਾਗੁ ਜੈਤਸਰੀ | Raag Jaethsree' },
  { gurmukhi: 'ਰਾਗੁ ਟੋਡੀ',                   english: 'Raag Todee',            paathName: 'ਰਾਗੁ ਟੋਡੀ | Raag Todee' },
  { gurmukhi: 'ਰਾਗੁ ਤਿਲੰਗ',                  english: 'Raag Tilang',           paathName: 'ਰਾਗੁ ਤਿਲੰਗ | Raag Tilang' },
  { gurmukhi: 'ਰਾਗੁ ਸੂਹੀ',                   english: 'Raag Soohee',           paathName: 'ਰਾਗੁ ਸੂਹੀ | Raag Soohee' },
  { gurmukhi: 'ਰਾਗੁ ਬਿਲਾਵਲੁ',                english: 'Raag Bilaaval',         paathName: 'ਰਾਗੁ ਬਿਲਾਵਲੁ | Raag Bilaaval' },
  { gurmukhi: 'ਰਾਗੁ ਗੋਂਡ',                    english: 'Raag Gond',             paathName: 'ਰਾਗੁ ਗੋਂਡ | Raag Gond' },
  { gurmukhi: 'ਰਾਗੁ ਰਾਮਕਲੀ',                 english: 'Raag Raamkalee',        paathName: 'ਰਾਗੁ ਰਾਮਕਲੀ | Raag Raamkalee' },
  { gurmukhi: 'ਰਾਗੁ ਮਾਲੀ ਗਉੜਾ',              english: 'Raag Maalee Gaudaa',    paathName: 'ਰਾਗੁ ਮਾਲੀ ਗਉੜਾ | Raag Maalee Gaudaa' },
  { gurmukhi: 'ਰਾਗੁ ਮਾਰੂ',                   english: 'Raag Maaroo',           paathName: 'ਰਾਗੁ ਮਾਰੂ | Raag Maaroo' },
  { gurmukhi: 'ਰਾਗੁ ਕੇਦਾਰਾ',                 english: 'Raag Kedaaraa',         paathName: 'ਰਾਗੁ ਕੇਦਾਰਾ | Raag Kedaaraa' },
  { gurmukhi: 'ਰਾਗੁ ਭੈਰਉ',                   english: 'Raag Bhaero',           paathName: 'ਰਾਗੁ ਭੈਰਉ | Raag Bhaero' },
  { gurmukhi: 'ਰਾਗੁ ਬਸੰਤੁ',                  english: 'Raag Basanth',          paathName: 'ਰਾਗੁ ਬਸੰਤੁ | Raag Basanth' },
  { gurmukhi: 'ਰਾਗੁ ਸਾਰੰਗ',                  english: 'Raag Saarang',          paathName: 'ਰਾਗੁ ਸਾਰੰਗ | Raag Saarang' },
  { gurmukhi: 'ਰਾਗੁ ਮਲਾਰ',                   english: 'Raag Malaar',           paathName: 'ਰਾਗੁ ਮਲਾਰ | Raag Malaar' },
  { gurmukhi: 'ਰਾਗੁ ਕਾਨੜਾ',                  english: 'Raag Kaanadaa',         paathName: 'ਰਾਗੁ ਕਾਨੜਾ | Raag Kaanadaa' },
  { gurmukhi: 'ਰਾਗੁ ਪ੍ਰਭਾਤੀ',                english: 'Raag Prabhaatee',       paathName: 'ਰਾਗੁ ਪ੍ਰਭਾਤੀ | Raag Prabhaatee' },
  { gurmukhi: 'ਭਗਤ ਬਾਣੀ - ਸਲੋਕ ਕਬੀਰ ਜੀ ਕੇ', english: 'Salok Bhagat Kabir Ji Ke',  paathName: 'ਭਗਤ ਬਾਣੀ - ਸਲੋਕ ਕਬੀਰ ਜੀ ਕੇ | Bhagat Bani - Salok Kabir Ji ke' },
  { gurmukhi: 'ਭਗਤ ਬਾਣੀ - ਸਲੋਕ ਭਗਤ ਫਰੀਦ ਜੀ ਕੇ', english: 'Salok Bhagat Fareed Ji Ke', paathName: 'ਭਗਤ ਬਾਣੀ - ਸਲੋਕ ਭਗਤ ਫਰੀਦ ਜੀ ਕੇ | Bhagat Bani - Salok Bhagat Fareed Ji ke' },
];

export default function BhagatBaniList() {
  const navigation = useNavigation<BhagatBaniNavProp>();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>BHAGAT BANI · GURBANI</Text>
        <Text style={styles.header}>Bhagat Bani</Text>
        <Text style={styles.headerGurmukhi}>ਭਗਤ ਬਾਣੀ</Text>

        <View style={styles.list}>
          {ENTRIES.map((entry, i) => (
            <TouchableOpacity
              key={i}
              style={styles.row}
              onPress={() => navigation.navigate('PaathDetail', { paathName: entry.paathName })}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open ${entry.english}`}
            >
              <View style={styles.rowAccent} />
              <View style={styles.textWrap}>
                <Text style={styles.titleGurmukhi}>{entry.gurmukhi}</Text>
                <Text style={styles.titleEnglish}>{entry.english}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const SAFFRON    = '#E06B1F';
const TEAL       = '#13302E';
const PARCHMENT  = '#FBF6EE';
const IVORY      = '#F8F1E6';
const IVORY_DEEP = '#F0E6D4';
const INK        = '#1A1612';
const MUTED      = '#6B6054';

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: PARCHMENT },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  eyebrow:       { fontFamily: 'Inter-SemiBold', fontSize: 10, color: SAFFRON, letterSpacing: 1.6, marginTop: 16, marginBottom: 4 },
  header:        { fontFamily: 'Fraunces-Regular', fontSize: 36, color: TEAL, lineHeight: 40 },
  headerGurmukhi:{ fontFamily: 'NotoSansGurmukhi', fontSize: 22, color: SAFFRON, marginTop: 4, marginBottom: 20 },

  list:     { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: PARCHMENT,
    borderRadius: 14, paddingVertical: 14, paddingRight: 14,
    borderWidth: 1, borderColor: IVORY_DEEP, overflow: 'hidden',
  },
  rowAccent:     { width: 3, alignSelf: 'stretch', backgroundColor: SAFFRON, borderRadius: 2, marginRight: 12 },
  textWrap:      { flex: 1, paddingRight: 8 },
  titleGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 16, color: INK, lineHeight: 24 },
  titleEnglish:  { fontFamily: 'Inter-Regular', fontSize: 12, color: MUTED, marginTop: 2 },
});
