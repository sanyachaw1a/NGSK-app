// PaathDetail.tsx — SQLite-backed with virtualized FlatList
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Pressable,
  Modal,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './_layout';
import { getVersesByTokens, isTokenSeeded, type VerseRow } from '../lib/db';

type PaathDetailRouteProp = RouteProp<RootStackParamList, 'PaathDetail'>;

type VisraamMark = { p: number | string; t: string };
type Visraam = {
  sttm?: VisraamMark[];
  sttm2?: VisraamMark[];
  igurbani?: VisraamMark[];
};

interface VerseData {
  verse?: {
    verse?: { unicode?: string; gurmukhi?: string };
    transliteration?: { hindi?: string };
    translation?: { en?: { bdb?: string; ms?: string; ssk?: string } };
    visraam?: Visraam;
  };
}

/* ---------- JSON fallback (used when SQLite seeding hasn't completed yet) ---------- */
const LOCAL_BY_TOKEN: Record<string, any> = {
  japji:               require('../assets/paath/japji.json'),
  sukhmani:            require('../assets/paath/sukhmani.json'),
  salokm9:             require('../assets/paath/salokm9.json'),
  sohila:              require('../assets/paath/sohila.json'),
  shabadhazare:        require('../assets/paath/shabadhazare.json'),
  anand:               require('../assets/paath/anand.json'),
  chaupai:             require('../assets/paath/chaupai.json'),
  rehras:              require('../assets/paath/rehras.json'),
  baarehmaha:          require('../assets/paath/baarehmaha.json'),
  aarti:               require('../assets/paath/aarti.json'),
  sidhgosht:           require('../assets/paath/sidhgosht.json'),
  bavanakhree:         require('../assets/paath/bavanakhree.json'),
  dhakhnioankar:       require('../assets/paath/dhakhnioankar.json'),
  dukhbhanjani:        require('../assets/paath/dukhbhanjani.json'),
  asadivar:            require('../assets/paath/asadivar.json'),
  vaarkabirjee:        require('../assets/paath/vaarkabirjee.json'),
  sahaskriti_shlok:    require('../assets/paath/sahaskriti_shlok.json'),
  savaiye:             require('../assets/paath/savaiye.json'),
  bhagatbani:          require('../assets/paath/bhagat_bani_-_shlok_kabir_ji_ke.json'),
  salokfareed:         require('../assets/paath/Salok_Bhagat_Fareed_Ji_Ke.json'),
  bhagat_sriraag:      require('../assets/paath/bhagat_sriraag.json'),
  bhagat_gauri:        require('../assets/paath/bhagat_gauri.json'),
  bhagat_aasa:         require('../assets/paath/bhagat_aasa.json'),
  bhagat_gujri:        require('../assets/paath/bhagat_gujri.json'),
  bhagat_sorat:        require('../assets/paath/bhagat_sorat.json'),
  bhagat_dhanasari:    require('../assets/paath/bhagat_dhanasari.json'),
  bhagat_jaitsree:     require('../assets/paath/bhagat_jaitsree.json'),
  bhagat_toddee:       require('../assets/paath/bhagat_toddee.json'),
  bhagat_tilang:       require('../assets/paath/bhagat_tilang.json'),
  bhagat_soohee:       require('../assets/paath/bhagat_soohee.json'),
  bhagat_bilaaval:     require('../assets/paath/bhagat_bilaaval.json'),
  bhagat_gond:         require('../assets/paath/bhagat_gond.json'),
  bhagat_ramkali:      require('../assets/paath/bhagat_ramkali.json'),
  bhagat_maaligauri:   require('../assets/paath/bhagat_maaligauri.json'),
  bhagat_maaru:        require('../assets/paath/bhagat_maaru.json'),
  bhagat_kedaara:      require('../assets/paath/bhagat_kedaara.json'),
  bhagat_bhairo:       require('../assets/paath/bhagat_bhairo.json'),
  bhagat_basant:       require('../assets/paath/bhagat_basant.json'),
  bhagat_saarang:      require('../assets/paath/bhagat_saarang.json'),
  bhagat_malaar:       require('../assets/paath/bhagat_malaar.json'),
  bhagat_kaanra:       require('../assets/paath/bhagat_kaanra.json'),
  bhagat_prabhaati:    require('../assets/paath/bhagat_prabhaati.json'),
};

/* ---------- Bhagat Bani raag definitions ---------- */
interface RaagDef { token: string; gurmukhi: string; english: string; }
const BHAGAT_BANI_RAAGS: RaagDef[] = [
  { token: 'bhagat_sriraag',    gurmukhi: 'ਰਾਗੁ ਸਿਰੀਰਾਗੁ',    english: 'Raag Sireeraag' },
  { token: 'bhagat_gauri',      gurmukhi: 'ਰਾਗੁ ਗਉੜੀ',         english: 'Raag Gaudi' },
  { token: 'bhagat_aasa',       gurmukhi: 'ਰਾਗੁ ਆਸਾ',           english: 'Raag Aasaa' },
  { token: 'bhagat_gujri',      gurmukhi: 'ਰਾਗੁ ਗੂਜਰੀ',         english: 'Raag Goojree' },
  { token: 'bhagat_sorat',      gurmukhi: 'ਰਾਗੁ ਸੋਰਠਿ',         english: 'Raag Sorath' },
  { token: 'bhagat_dhanasari',  gurmukhi: 'ਰਾਗੁ ਧਨਾਸਰੀ',        english: 'Raag Dhanaasree' },
  { token: 'bhagat_jaitsree',   gurmukhi: 'ਰਾਗੁ ਜੈਤਸਰੀ',        english: 'Raag Jaethsree' },
  { token: 'bhagat_toddee',     gurmukhi: 'ਰਾਗੁ ਟੋਡੀ',          english: 'Raag Todee' },
  { token: 'bhagat_tilang',     gurmukhi: 'ਰਾਗੁ ਤਿਲੰਗ',         english: 'Raag Tilang' },
  { token: 'bhagat_soohee',     gurmukhi: 'ਰਾਗੁ ਸੂਹੀ',          english: 'Raag Soohee' },
  { token: 'bhagat_bilaaval',   gurmukhi: 'ਰਾਗੁ ਬਿਲਾਵਲੁ',       english: 'Raag Bilaaval' },
  { token: 'bhagat_gond',       gurmukhi: 'ਰਾਗੁ ਗੋਂਡ',           english: 'Raag Gond' },
  { token: 'bhagat_ramkali',    gurmukhi: 'ਰਾਗੁ ਰਾਮਕਲੀ',        english: 'Raag Raamkalee' },
  { token: 'bhagat_maaligauri', gurmukhi: 'ਰਾਗੁ ਮਾਲੀ ਗਉੜਾ',     english: 'Raag Maalee Gaudaa' },
  { token: 'bhagat_maaru',      gurmukhi: 'ਰਾਗੁ ਮਾਰੂ',          english: 'Raag Maaroo' },
  { token: 'bhagat_kedaara',    gurmukhi: 'ਰਾਗੁ ਕੇਦਾਰਾ',        english: 'Raag Kedaaraa' },
  { token: 'bhagat_bhairo',     gurmukhi: 'ਰਾਗੁ ਭੈਰਉ',          english: 'Raag Bhaero' },
  { token: 'bhagat_basant',     gurmukhi: 'ਰਾਗੁ ਬਸੰਤੁ',         english: 'Raag Basanth' },
  { token: 'bhagat_saarang',    gurmukhi: 'ਰਾਗੁ ਸਾਰੰਗ',         english: 'Raag Saarang' },
  { token: 'bhagat_malaar',     gurmukhi: 'ਰਾਗੁ ਮਲਾਰ',          english: 'Raag Malaar' },
  { token: 'bhagat_kaanra',     gurmukhi: 'ਰਾਗੁ ਕਾਨੜਾ',         english: 'Raag Kaanadaa' },
  { token: 'bhagat_prabhaati',  gurmukhi: 'ਰਾਗੁ ਪ੍ਰਭਾਤੀ',       english: 'Raag Prabhaatee' },
];

/* ---------- List item type ---------- */
interface SectionHeader { _sectionHeader: true; gurmukhi: string; english: string; raagIndex: number; }
type ListItem = VerseData | SectionHeader;

/* ---------- Display name -> SQLite token(s) ---------- */
const paathToToken: Record<string, string | string[]> = {
  'ਜਪੁਜੀ ਸਾਹਿਬ | Japji Sahib':             'japji',
  'ਸੁਖਮਨੀ ਸਾਹਿਬ | Sukhmani Sahib':          'sukhmani',
  'ਸਲੋਕ ਮਹਲਾ ੯ | Shlok Mahala 9':           'salokm9',
  'ਕੀਰਤਨ ਸੋਹਿਲਾ | Kirtan Sohila':           'sohila',
  'ਸ਼ਬਦ ਹਜ਼ਾਰੇ | Shabad Hazare':             'shabadhazare',
  'ਆਨੰਦ ਸਾਹਿਬ | Anand Sahib':               'anand',
  'ਚੌਪਈ ਸਾਹਿਬ | Chaupai Sahib':             'chaupai',
  'ਰਹਿਰਾਸ ਸਾਹਿਬ | Rehraas Sahib':           'rehras',
  'ਬਾਰਹ ਮਾਹਾ ਮਾਂਝ | Barah Maha Manjh':      'baarehmaha',
  'ਆਰਤੀ | Aarti':                            'aarti',
  'ਸਿਧ ਗੋਸਟਿ | Sidh Gosht':                 'sidhgosht',
  'ਬਾਵਨ ਅਖਰੀ | Bavan Akhri':                'bavanakhree',
  'ਦਖਣੀ ਓਅੰਕਾਰੁ | Dakhni Oankar':           'dhakhnioankar',
  'ਦੁਖ ਭੰਜਨੀ ਸਾਹਿਬ | Dukh Banjani Sahib':  'dukhbhanjani',
  'ਆਸਾ ਦੀ ਵਾਰ | Asa Di Vaar':               'asadivar',
  'ਭਗਤ ਬਾਣੀ - ਸਲੋਕ ਕਬੀਰ ਜੀ ਕੇ | Bhagat Bani - Salok Kabir Ji ke': 'bhagatbani',
  'ਭਗਤ ਬਾਣੀ - ਸਲੋਕ ਭਗਤ ਫਰੀਦ ਜੀ ਕੇ | Bhagat Bani - Salok Bhagat Fareed Ji ke': 'salokfareed',
  'ਸਲੋਕ ਸਹਸਕ੍ਰਿਤੀ | Salok Sahaskriti':     'sahaskriti_shlok',
  'ਸਵੈਯੇ | Savaiye':                         'savaiye',
  'ਰਾਗੁ ਸਿਰੀਰਾਗੁ | Raag Sireeraag':         'bhagat_sriraag',
  'ਰਾਗੁ ਗਉੜੀ | Raag Gaudi':                 'bhagat_gauri',
  'ਰਾਗੁ ਆਸਾ | Raag Aasaa':                   'bhagat_aasa',
  'ਰਾਗੁ ਗੂਜਰੀ | Raag Goojree':               'bhagat_gujri',
  'ਰਾਗੁ ਸੋਰਠਿ | Raag Sorath':               'bhagat_sorat',
  'ਰਾਗੁ ਧਨਾਸਰੀ | Raag Dhanaasree':          'bhagat_dhanasari',
  'ਰਾਗੁ ਜੈਤਸਰੀ | Raag Jaethsree':           'bhagat_jaitsree',
  'ਰਾਗੁ ਟੋਡੀ | Raag Todee':                 'bhagat_toddee',
  'ਰਾਗੁ ਤਿਲੰਗ | Raag Tilang':               'bhagat_tilang',
  'ਰਾਗੁ ਸੂਹੀ | Raag Soohee':                'bhagat_soohee',
  'ਰਾਗੁ ਬਿਲਾਵਲੁ | Raag Bilaaval':           'bhagat_bilaaval',
  'ਰਾਗੁ ਗੋਂਡ | Raag Gond':                   'bhagat_gond',
  'ਰਾਗੁ ਰਾਮਕਲੀ | Raag Raamkalee':           'bhagat_ramkali',
  'ਰਾਗੁ ਮਾਲੀ ਗਉੜਾ | Raag Maalee Gaudaa':   'bhagat_maaligauri',
  'ਰਾਗੁ ਮਾਰੂ | Raag Maaroo':                'bhagat_maaru',
  'ਰਾਗੁ ਕੇਦਾਰਾ | Raag Kedaaraa':            'bhagat_kedaara',
  'ਰਾਗੁ ਭੈਰਉ | Raag Bhaero':                'bhagat_bhairo',
  'ਰਾਗੁ ਬਸੰਤੁ | Raag Basanth':              'bhagat_basant',
  'ਰਾਗੁ ਸਾਰੰਗ | Raag Saarang':              'bhagat_saarang',
  'ਰਾਗੁ ਮਲਾਰ | Raag Malaar':                'bhagat_malaar',
  'ਰਾਗੁ ਕਾਨੜਾ | Raag Kaanadaa':             'bhagat_kaanra',
  'ਰਾਗੁ ਪ੍ਰਭਾਤੀ | Raag Prabhaatee':        'bhagat_prabhaati',
};

/* ---------- Verse loading ---------- */

function rowToVerseData(row: VerseRow): VerseData {
  return {
    verse: {
      verse: {
        unicode:  row.gurmukhi_unicode ?? undefined,
        gurmukhi: row.gurmukhi_raw    ?? undefined,
      },
      transliteration: { hindi: row.transliteration_hindi ?? undefined },
      translation: {
        en: {
          bdb: row.translation_en_bdb ?? undefined,
          ms:  row.translation_en_ms  ?? undefined,
          ssk: row.translation_en_ssk ?? undefined,
        },
      },
      visraam: row.visraam_json ? JSON.parse(row.visraam_json) : undefined,
    },
  };
}

function jsonFallback(tokens: string[]): VerseData[] {
  const out: VerseData[] = [];
  for (const t of tokens) {
    const mod = LOCAL_BY_TOKEN[t];
    if (!mod) continue;
    const verses = Array.isArray(mod?.verses) ? mod.verses : mod?.default?.verses;
    if (Array.isArray(verses)) out.push(...verses);
  }
  return out;
}

async function getVerses(paathName: string): Promise<ListItem[]> {
  const mapping = paathToToken[paathName];
  if (!mapping) throw new Error(`No token mapping for "${paathName}"`);

  const tokens = Array.isArray(mapping) ? mapping : [mapping];
  const seededFlags = await Promise.all(tokens.map(isTokenSeeded));
  if (seededFlags.every(Boolean)) {
    const rows = await getVersesByTokens(tokens);
    return rows.map(rowToVerseData);
  }
  const fallback = jsonFallback(tokens);
  if (fallback.length) return fallback;
  throw new Error(`No verses found for "${paathName}"`);
}

/* ---------- Visraam ---------- */
const VISRAAM_COLORS: Record<string, string> = { v: '#e28324ff', y: '#69a33fff', m: '#69a33fff' };

function pickVisraam(v?: Visraam): VisraamMark[] {
  if (!v) return [];
  if (v.igurbani?.length) return v.igurbani;
  if (v.sttm?.length) return v.sttm;
  if (v.sttm2?.length) return v.sttm2;
  return [];
}

/* ---------- Fonts ---------- */
const FONTS = {
  gurmukhi:   Platform.select({ ios: 'Gurmukhi MN', android: 'NotoSansGurmukhi-Regular' }),
  devanagari: Platform.select({ ios: 'Times New Roman', android: 'NotoSansDevanagari-Regular' }),
};

/* ---------- GurmukhiWithVisraam ---------- */
function GurmukhiWithVisraam({ text, marks, fs }: { text: string; marks: VisraamMark[]; fs: number }) {
  const words = text.split(/\s+/);
  const map = new Map<number, string>();
  marks.forEach(m => {
    const idx = typeof m.p === 'string' ? parseInt(m.p as string, 10) : (m.p as number);
    if (!Number.isNaN(idx)) map.set(idx, m.t);
  });
  const base = {
    fontSize: fs, lineHeight: Math.ceil(fs * 1.5), color: TEXT,
    paddingVertical: 2, includeFontPadding: true, fontFamily: FONTS.gurmukhi as string,
  } as const;
  return (
    <Text style={[styles.gurmukhi, base]} maxFontSizeMultiplier={2.2}>
      {words.map((w, i) => {
        const t = map.get(i);
        const colored = t && VISRAAM_COLORS[t];
        const piece = w + (i < words.length - 1 ? ' ' : '');
        return (
          <Text key={i} style={[{ fontFamily: FONTS.gurmukhi as string }, colored ? { color: colored, fontWeight: '700' } : null]}>
            {piece}
          </Text>
        );
      })}
    </Text>
  );
}

/* ---------- VerseItem ---------- */
interface VerseItemProps {
  verse: VerseData;
  fontSize: number;
  minSize: number;
  showGurmukhi: boolean;
  showHindi: boolean;
  showEnglish: boolean;
}

const VerseItem = React.memo(function VerseItem({
  verse: v, fontSize, minSize, showGurmukhi, showHindi, showEnglish,
}: VerseItemProps) {
  const gurmukhi        = v.verse?.verse?.unicode || v.verse?.verse?.gurmukhi || '';
  const transliteration = v.verse?.transliteration?.hindi || '';
  const translation     =
    v.verse?.translation?.en?.ssk ||
    v.verse?.translation?.en?.ms  ||
    v.verse?.translation?.en?.bdb || '';
  const visraamMarks    = pickVisraam(v.verse?.visraam);

  return (
    <View style={styles.verseBlock}>
      {showGurmukhi && !!gurmukhi && (
        <GurmukhiWithVisraam text={gurmukhi} marks={visraamMarks} fs={fontSize} />
      )}
      {showHindi && !!transliteration && (
        <Text
          style={[styles.transliteration, { fontSize: Math.max(minSize, fontSize - 4), lineHeight: Math.ceil(Math.max(minSize, fontSize - 4) * 1.35) }]}
          maxFontSizeMultiplier={2.0}
        >
          {transliteration}
        </Text>
      )}
      {showEnglish && !!translation && (
        <Text
          style={[styles.translation, { fontSize: Math.max(minSize, fontSize - 8), lineHeight: Math.ceil(Math.max(minSize, fontSize - 8) * 1.35) }]}
          maxFontSizeMultiplier={2.0}
        >
          {translation}
        </Text>
      )}
    </View>
  );
});

/* ---------- Bookmark key ---------- */
const BOOKMARKS_KEY = 'paath_bookmarks_v1';

/* ========== Main screen ========== */
export default function PaathDetail() {
  const route      = useRoute<PaathDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { paathName } = route.params;

  const parts         = paathName.split(' | ');
  const gurmukhiTitle = parts[0] || paathName;
  const englishTitle  = parts[1] || '';

  const [loading, setLoading]   = useState(true);
  const [verses, setVerses]     = useState<ListItem[]>([]);
  const [error, setError]       = useState<string | null>(null);

  const [fontSize, setFontSize]         = useState(22);
  const MIN_SIZE = 12, MAX_SIZE = 40;
  const [showGurmukhi, setShowGurmukhi] = useState(true);
  const [showHindi, setShowHindi]       = useState(true);
  const [showEnglish, setShowEnglish]   = useState(true);

  const [isBookmarked, setIsBookmarked]   = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const flatListRef = useRef<FlatList<ListItem>>(null);

  /* Custom nav header — stacked Gurmukhi + English */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.navGurmukhi} numberOfLines={1} adjustsFontSizeToFit>
            {gurmukhiTitle}
          </Text>
          {!!englishTitle && (
            <Text style={styles.navEnglish} numberOfLines={1} adjustsFontSizeToFit>
              {englishTitle}
            </Text>
          )}
        </View>
      ),
    });
  }, [navigation, gurmukhiTitle, englishTitle]);

  /* Load bookmark state */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
        const arr: string[] = raw ? JSON.parse(raw) : [];
        setIsBookmarked(arr.includes(paathName));
      } catch {}
    })();
  }, [paathName]);

  /* Load verses */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await getVerses(paathName);
        if (!cancelled) { setVerses(loaded); setLoading(false); }
      } catch (e: any) {
        if (!cancelled) { setError(e?.message || 'Could not load this paath.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [paathName]);

  const announceSize = (dir: 'larger' | 'smaller') =>
    AccessibilityInfo.announceForAccessibility?.(dir === 'larger' ? 'Text larger' : 'Text smaller');
  const increaseFont = () => setFontSize(s => { const n = Math.min(MAX_SIZE, s + 2); if (n !== s) announceSize('larger'); return n; });
  const decreaseFont = () => setFontSize(s => { const n = Math.max(MIN_SIZE, s - 2); if (n !== s) announceSize('smaller'); return n; });

  const toggleBookmark = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const already = arr.includes(paathName);
      const next = already ? arr.filter(x => x !== paathName) : [...arr, paathName];
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      setIsBookmarked(!already);
    } catch {}
  }, [paathName]);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const displayVerses = useMemo(() =>
    verses.filter(v => {
      if ('_sectionHeader' in v) return true;
      const g = v.verse?.verse?.unicode || v.verse?.verse?.gurmukhi;
      const h = v.verse?.transliteration?.hindi;
      const e = v.verse?.translation?.en?.ssk || v.verse?.translation?.en?.ms || v.verse?.translation?.en?.bdb;
      return (showGurmukhi && !!g) || (showHindi && !!h) || (showEnglish && !!e);
    }),
    [verses, showGurmukhi, showHindi, showEnglish]
  );

  const extraData = useMemo(
    () => ({ fontSize, showGurmukhi, showHindi, showEnglish }),
    [fontSize, showGurmukhi, showHindi, showEnglish]
  );

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if ('_sectionHeader' in item) {
      return <RaagSectionHeader gurmukhi={item.gurmukhi} english={item.english} />;
    }
    return (
      <VerseItem
        verse={item}
        fontSize={fontSize}
        minSize={MIN_SIZE}
        showGurmukhi={showGurmukhi}
        showHindi={showHindi}
        showEnglish={showEnglish}
      />
    );
  }, [fontSize, showGurmukhi, showHindi, showEnglish]);

  const Separator = useCallback(() => <View accessible style={styles.divider} />, []);

  const ListHeader = useMemo(() => {
    const verseCount = verses.filter(v => !('_sectionHeader' in v)).length;
    return (
      <View>
        <View style={styles.headerCard}>
          <Text style={styles.titleGurmukhi}>{gurmukhiTitle}</Text>
          {!!englishTitle && <Text style={styles.titleEnglish}>{englishTitle}</Text>}
          <View style={styles.headerDivider} />
          <Text style={styles.headerStats}>
            {verseCount > 0 ? `${verseCount} VERSES` : 'NO VERSES AVAILABLE'}
          </Text>
        </View>
        {showGurmukhi && (
          <View style={styles.legendRow} accessible accessibilityLabel="Pause legend">
            <LegendDot color={VISRAAM_COLORS.y} label="Gentle Pause" />
            <LegendDot color={VISRAAM_COLORS.v} label="Short Pause" />
          </View>
        )}
      </View>
    );
  }, [paathName, verses.length, showGurmukhi]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading {paathName}…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Sticky action bar — always visible, sits above FlatList */}
      <View style={styles.actionBar}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={toggleBookmark}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark this paath'}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isBookmarked ? SAFFRON : TEAL}
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={() => setSettingsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Font and language settings"
        >
          <Ionicons name="options-outline" size={20} color={TEAL} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={scrollToTop}
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
        >
          <Ionicons name="arrow-up" size={20} color={TEAL} />
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayVerses}
        keyExtractor={(item, i) => ('_sectionHeader' in item ? `section-${(item as SectionHeader).raagIndex}` : String(i))}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {error ?? `No content found for ${paathName}.`}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
        extraData={extraData}
        initialNumToRender={20}
        windowSize={15}
        removeClippedSubviews
        showsVerticalScrollIndicator
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={styles.content}
      />

      {/* Settings modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSettingsVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Display Settings</Text>

            {/* Font size */}
            <Text style={styles.modalLabel}>Font Size</Text>
            <View style={styles.fontRow}>
              <Pressable
                style={({ pressed }) => [styles.fontBtn, pressed && { opacity: 0.7 }]}
                onPress={decreaseFont}
                disabled={fontSize <= MIN_SIZE}
                accessibilityLabel="Decrease font size"
              >
                <Text style={[styles.fontBtnText, fontSize <= MIN_SIZE && { opacity: 0.35 }]}>−</Text>
              </Pressable>
              <Text style={styles.fontSizeDisplay}>{fontSize}</Text>
              <Pressable
                style={({ pressed }) => [styles.fontBtn, pressed && { opacity: 0.7 }]}
                onPress={increaseFont}
                disabled={fontSize >= MAX_SIZE}
                accessibilityLabel="Increase font size"
              >
                <Text style={[styles.fontBtnText, fontSize >= MAX_SIZE && { opacity: 0.35 }]}>+</Text>
              </Pressable>
            </View>

            {/* Language toggles */}
            <Text style={styles.modalLabel}>Languages</Text>
            <View style={styles.toggleGroup}>
              <ToggleChip label="Gurmukhi" active={showGurmukhi} onPress={() => setShowGurmukhi(v => !v)} />
              <ToggleChip label="Hindi"    active={showHindi}    onPress={() => setShowHindi(v => !v)} />
              <ToggleChip label="English"  active={showEnglish}  onPress={() => setShowEnglish(v => !v)} />
            </View>

            <Pressable style={styles.modalDone} onPress={() => setSettingsVisible(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function RaagSectionHeader({ gurmukhi, english }: { gurmukhi: string; english: string }) {
  return (
    <View style={styles.raagHeader}>
      <View style={styles.raagHeaderAccent} />
      <View style={styles.raagHeaderText}>
        <Text style={styles.raagHeaderGurmukhi}>{gurmukhi}</Text>
        <Text style={styles.raagHeaderEnglish}>{english}</Text>
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function ToggleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`Toggle ${label}`}
      style={({ pressed }) => [styles.chip, active ? styles.chipActive : styles.chipInactive, pressed && { opacity: 0.75 }]}
      hitSlop={6}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{label}</Text>
    </Pressable>
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
const WASH       = IVORY;
const CARD_BG    = PARCHMENT;
const TEXT       = INK;
const SUBTLE     = MUTED;

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: WASH },
  content:     { paddingBottom: 24 },
  loader:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: WASH },
  loadingText: { marginTop: 10, fontSize: 15, color: PRIMARY, fontFamily: 'Inter-SemiBold' },

  /* Nav header */
  navGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 16, color: TEAL, textAlign: 'center' },
  navEnglish:  { fontFamily: 'Fraunces-LightItalic', fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 1 },

  /* Sticky action bar */
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  actionBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: WASH, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnPressed: { opacity: 0.65 },

  /* Header card */
  headerCard: {
    backgroundColor: CARD_BG, borderRadius: 16, marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center',
    borderWidth: 1, borderColor: IVORY_DEEP,
  },
  titleGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 26, color: SAFFRON, textAlign: 'center', lineHeight: 38 },
  titleEnglish:  { fontFamily: 'Fraunces-LightItalic', fontSize: 15, color: MUTED, textAlign: 'center', marginTop: 4 },
  headerDivider: { width: '50%', height: 1, backgroundColor: IVORY_DEEP, marginVertical: 12 },
  headerStats:   { fontFamily: 'Inter-SemiBold', fontSize: 10, color: MUTED, letterSpacing: 1.4 },

  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot:  { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: SUBTLE, fontFamily: 'Inter-Regular' },

  raagHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 20, marginBottom: 8,
    backgroundColor: CARD_BG, borderRadius: 12,
    borderWidth: 1, borderColor: IVORY_DEEP, overflow: 'hidden',
  },
  raagHeaderAccent:   { width: 4, alignSelf: 'stretch', backgroundColor: SAFFRON },
  raagHeaderText:     { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  raagHeaderGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 17, color: TEAL, lineHeight: 26 },
  raagHeaderEnglish:  { fontFamily: 'Fraunces-LightItalic', fontSize: 12, color: MUTED, marginTop: 2 },

  verseBlock: { paddingVertical: 14, paddingHorizontal: 16 },
  divider:    { height: Math.max(1, StyleSheet.hairlineWidth * 2), backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 6, opacity: 1 },

  gurmukhi:        { fontSize: 22, lineHeight: 32, color: TEXT, marginBottom: 6, includeFontPadding: true, fontFamily: FONTS.gurmukhi as string },
  transliteration: { fontSize: 18, color: SUBTLE, marginBottom: 4, fontStyle: 'italic', fontFamily: FONTS.devanagari as string },
  translation:     { fontSize: 14, color: '#3C3F44' },
  emptyCard:       { backgroundColor: CARD_BG, borderRadius: 14, padding: 16, marginHorizontal: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  emptyText:       { color: SUBTLE, fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'center' },

  /* Settings modal */
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: CARD_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
    borderTopWidth: 1, borderColor: BORDER,
  },
  modalHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  modalTitle:    { fontFamily: 'Fraunces-Regular', fontSize: 22, color: TEAL, marginBottom: 20 },
  modalLabel:    { fontFamily: 'Inter-SemiBold', fontSize: 11, color: MUTED, letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
  fontRow:       { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  fontBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: WASH, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  fontBtnText:      { fontSize: 20, fontFamily: 'Inter-Bold', color: TEAL, includeFontPadding: false },
  fontSizeDisplay:  { fontFamily: 'Inter-SemiBold', fontSize: 18, color: TEAL, minWidth: 36, textAlign: 'center' },
  toggleGroup:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip:             { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipActive:       { backgroundColor: TEAL, borderColor: TEAL },
  chipInactive:     { backgroundColor: WASH, borderColor: IVORY_DEEP },
  chipText:         { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  chipTextActive:   { color: '#FFFFFF' },
  chipTextInactive: { color: MUTED },
  modalDone: {
    backgroundColor: TEAL, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  modalDoneText: { color: '#FFFFFF', fontFamily: 'Inter-SemiBold', fontSize: 15 },
});
