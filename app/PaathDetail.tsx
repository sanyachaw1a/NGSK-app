// PaathDetail.tsx — LOCAL-ONLY (no network)
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Pressable,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PaathDetailRouteProp = RouteProp<RootStackParamList, 'PaathDetail'>;

type VisraamMark = { p: number | string; t: string };
type Visraam = {
  sttm?: VisraamMark[];
  sttm2?: VisraamMark[];
  igurbani?: VisraamMark[];
};

interface VerseData {
  header?: number;
  verse?: {
    verse?: { unicode?: string; gurmukhi?: string };
    transliteration?: { hindi?: string };
    translation?: { en?: { bdb?: string; ms?: string; ssk?: string } };
    visraam?: Visraam;
  };
}

/* ---------- Local files ---------- */
/* Single-token JSONs named by token, placed in ../assets/paath/<token>.json */
const LOCAL_BY_TOKEN: Record<string, any> = {
  japji: require('../assets/paath/japji.json'),
  sukhmani: require('../assets/paath/sukhmani.json'),
  salokm9: require('../assets/paath/salokm9.json'),
  sohila: require('../assets/paath/sohila.json'),
  shabadhazare: require('../assets/paath/shabadhazare.json'),
  anand: require('../assets/paath/anand.json'),
  chaupai: require('../assets/paath/chaupai.json'),
  rehras: require('../assets/paath/rehras.json'),
  baarehmaha: require('../assets/paath/baarehmaha.json'),
  aarti: require('../assets/paath/aarti.json'),
  sidhgosht: require('../assets/paath/sidhgosht.json'),
  bavanakhree: require('../assets/paath/bavanakhree.json'),
  dhakhnioankar: require('../assets/paath/dhakhnioankar.json'),
  dukhbhanjani: require('../assets/paath/dukhbhanjani.json'),
  asadivar: require('../assets/paath/asadivar.json'),
};


const bhagatBaniTokens = [
  'salokkabir',
  'salokfareed',
  'baavanakhrikabirjee',
  'tilang',
  'toddee',
  'sriraag',
];

// Cache (still fine for quick re-opens)
const CACHE_KEY = 'paath_detail_cache_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type CacheEntry = { name: string; updatedAt: number; verses: VerseData[]; };

async function loadCache(): Promise<CacheEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as CacheEntry[];
    return Array.isArray(arr) ? arr.filter(e => e?.name && Array.isArray(e?.verses)) : [];
  } catch { return []; }
}
async function saveCache(entries: CacheEntry[]): Promise<void> {
  try {
    const sorted = [...entries].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,2);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(sorted));
  } catch {}
}
function getFromCache(entries: CacheEntry[], name: string) {
  return entries.find(e => e.name === name);
}
function isFresh(entry: CacheEntry) {
  return Date.now() - entry.updatedAt < CACHE_TTL_MS;
}

const svaiyes = ['sirimukhbaakm1a','sirimukhbaakm1b','svaiyem1','svaiyem2','svaiyem3','svaiyem4','svaiyem5'];

/* Display name -> token(s) */
const paathToToken: Record<string, string | string[]> = {
  'ਜਪੁਜੀ ਸਾਹਿਬ | Japji Sahib': 'japji',
  'ਸੁਖਮਨੀ ਸਾਹਿਬ | Sukhmani Sahib': 'sukhmani',
  'ਸਲੋਕ ਮਹਲਾ ੯ | Shlok Mahala 9': 'salokm9',
  'ਕੀਰਤਨ ਸੋਹਿਲਾ | Kirtan Sohila': 'sohila',
  'ਸ਼ਬਦ ਹਜ਼ਾਰੇ | Shabad Hazare': 'shabadhazare',
  'ਆਨੰਦ ਸਾਹਿਬ | Anand Sahib': 'anand',
  'ਚੌਪਈ ਸਾਹਿਬ | Chaupai Sahib': 'chaupai',
  'ਰਹਿਰਾਸ ਸਾਹਿਬ | Rehraas Sahib': 'rehras',
  'ਬਾਰਹ ਮਾਹਾ ਮਾਂਝ | Barah Maha Manjh': 'baarehmaha',
  'ਆਰਤੀ | Aarti': 'aarti',
  'ਸਿਧ ਗੋਸਟਿ | Sidh Gosht': 'sidhgosht',
  'ਬਾਵਨ ਅਖਰੀ | Bavan Akhri': 'bavanakhree',
  'ਦਖਣੀ ਓਅੰਕਾਰੁ | Dakhni Oankar': 'dhakhnioankar',
  'ਦੁਖ ਭੰਜਨੀ ਸਾਹਿਬ | Dukh Banjani Sahib': 'dukhbhanjani',
  'ਆਸਾ ਦੀ ਵਾਰ | Asa Di Vaar': 'asadivar',
  'Savaiye': svaiyes,
  'Bhagat Bani - Shlok Kabir Ji ke': bhagatBaniTokens,
  'Bai Vaaran': 'vaarkabirjee',
  'Sahaskriti Shlok': 'sahas_kriti', // will use combined file if present
};

/* ---------- Local loader helpers ---------- */
function loadLocalPayload(mod: any): VerseData[] | null {
  const verses = Array.isArray(mod?.verses) ? mod.verses : mod?.default?.verses;
  return Array.isArray(verses) ? verses : null;
}

function loadByToken(token: string): VerseData[] | null {
  try {
    const mod = LOCAL_BY_TOKEN[token];
    if (!mod) return null;
    return loadLocalPayload(mod);
  } catch { return null; }
}
async function getLocalVerses(paathName: string): Promise<VerseData[]> {
  // Prefer a single combined file if it exists for multi-token sets & Sahaskriti


  const tokens = paathToToken[paathName];
  if (!tokens) throw new Error(`No token mapping for ${paathName}`);

  const list = Array.isArray(tokens) ? tokens : [tokens];

  // Single-token
  if (list.length === 1 && list[0] !== 'sahas_kriti') {
    const one = loadByToken(list[0] as string);
    if (one) return one;
    throw new Error(`Local file missing for token: ${list[0]}`);
  }

  // Multi-token fallback: concat per-token files if present
  const out: VerseData[] = [];
  for (const t of list) {
    if (t === 'sahas_kriti') continue; // expect combined file for this one
    const v = loadByToken(t as string);
    if (v) out.push(...v);
  }
  if (out.length) return out;

  // Sahaskriti fallback message
  if (list.includes('sahas_kriti')) {
    throw new Error('Local file missing for Sahaskriti (expected assets/paath/sahaskriti_shlok.json)');
  }
  throw new Error(`No local files found for ${paathName}`);
}

/* ---------- Fonts ---------- */
const FONTS = {
  gurmukhi: Platform.select({ ios: 'Gurmukhi MN', android: 'NotoSansGurmukhi-Regular' }),
  devanagari: Platform.select({ ios: 'Times New Roman', android: 'NotoSansDevanagari-Regular' }),
  latinUI: Platform.select({ ios: undefined, android: undefined }),
  latinUIBold: Platform.select({ ios: undefined, android: undefined }),
};

export default function PaathDetail() {
  const route = useRoute<PaathDetailRouteProp>();
  const { paathName } = route.params;

  const [loading, setLoading] = useState(true);
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Font size controls
  const [fontSize, setFontSize] = useState(22);
  const MIN_SIZE = 12, MAX_SIZE = 40;
  const [showGurmukhi, setShowGurmukhi] = useState(true);
  const [showHindi, setShowHindi] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);

  const announceSize = (dir: 'larger' | 'smaller') =>
    AccessibilityInfo.announceForAccessibility?.(dir === 'larger' ? 'Text larger' : 'Text smaller');
  const increaseFont = () => setFontSize(s => { const n = Math.min(MAX_SIZE, s + 2); if (n !== s) announceSize('larger'); return n; });
  const decreaseFont = () => setFontSize(s => { const n = Math.max(MIN_SIZE, s - 2); if (n !== s) announceSize('smaller'); return n; });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      // 1) cache
      const cache = await loadCache();
      const cached = getFromCache(cache, paathName);
      if (cached && isFresh(cached)) {
        if (!cancelled) { setVerses(cached.verses); setLoading(false); }
        return;
      }

      // 2) local assets
      try {
        const local = await getLocalVerses(paathName);
        if (!cancelled) {
          setVerses(local);
          setLoading(false);
        }

        const updated: CacheEntry = { name: paathName, verses: local, updatedAt: Date.now() };
        const next = cached ? cache.map(e => e.name === paathName ? updated : e) : [updated, ...cache];
        await saveCache(next);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Could not load local file for this paath.');
          setVerses([]);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [paathName]);

  const verseCount = useMemo(() => verses.length, [verses]);

  /* ===== Visraam helpers ===== */
  const VISRAAM_COLORS: Record<string, string> = { v: '#e28324ff', y: '#69a33fff', m: '#69a33fff' };
  const pickVisraam = (v?: Visraam): VisraamMark[] => {
    if (!v) return [];
    if (v.igurbani && v.igurbani.length) return v.igurbani;
    if (v.sttm && v.sttm.length) return v.sttm;
    if (v.sttm2 && v.sttm2.length) return v.sttm2;
    return [];
  };

  const GurmukhiWithVisraam = ({ text, marks, fs }: { text: string; marks: VisraamMark[]; fs: number }) => {
    const words = text.split(/\s+/);
    const map = new Map<number, string>();
    marks.forEach(m => {
      const idx = typeof m.p === 'string' ? parseInt(m.p as string, 10) : (m.p as number);
      if (!Number.isNaN(idx)) map.set(idx, m.t);
    });

    const base = {
      fontSize: fs, lineHeight: Math.ceil(fs * 1.5), color: TEXT, paddingVertical: 2, includeFontPadding: true,
      fontFamily: FONTS.gurmukhi as string,
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
  };

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Header */}
        {(() => {
          const parts = paathName.split(' | ');
          const gurmukhiTitle = parts[0] || paathName;
          const englishTitle  = parts[1] || '';
          return (
            <View style={styles.headerCard}>
              <Text style={styles.titleGurmukhi}>{gurmukhiTitle}</Text>
              {!!englishTitle && <Text style={styles.titleEnglish}>{englishTitle}</Text>}
              <View style={styles.headerDivider} />
              <Text style={styles.headerStats}>
                {verseCount > 0 ? `${verseCount} VERSES` : 'NO VERSES AVAILABLE'}
              </Text>
            </View>
          );
        })()}

        {/* Toolbar */}
        <View style={styles.toolbar} accessibilityRole="toolbar" accessible>
          <View style={styles.ttLogo}><Text style={styles.ttSmall}>T</Text><Text style={styles.ttLarge}>T</Text></View>
          <View style={styles.toolbarBtns}>
            <Pressable accessibilityRole="button" accessibilityLabel="Decrease text size" onPress={decreaseFont} style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]} hitSlop={8}>
              <Text style={styles.toolbarBtnText} allowFontScaling={false}>−</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Increase text size" onPress={increaseFont} style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]} hitSlop={8}>
              <Text style={styles.toolbarBtnText} allowFontScaling={false}>+</Text>
            </Pressable>
          </View>
          <View style={styles.toggleGroup} accessibilityRole="tablist">
            <ToggleChip label="Gurmukhi" active={showGurmukhi} onPress={() => setShowGurmukhi(v => !v)} />
            <ToggleChip label="Hindi" active={showHindi} onPress={() => setShowHindi(v => !v)} />
            <ToggleChip label="English" active={showEnglish} onPress={() => setShowEnglish(v => !v)} />
          </View>
        </View>

        {/* Legend */}
        {showGurmukhi && (
          <View style={styles.legendRow} accessible accessibilityLabel="Pause legend">
            <LegendDot color={VISRAAM_COLORS.y} label="Gentle Pause" />
            <LegendDot color={VISRAAM_COLORS.v} label="Short Pause" />
          </View>
        )}

        {error ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>{error}</Text></View>
        ) : verseCount > 0 ? (
          (() => {
            let aatpadiCount = 0;
            return verses.map((v, idx) => {
              const gurmukhi = v.verse?.verse?.unicode || v.verse?.verse?.gurmukhi || '';
              const transliteration = v.verse?.transliteration?.hindi || '';
              const translation =
                v.verse?.translation?.en?.ssk ||
                v.verse?.translation?.en?.ms ||
                v.verse?.translation?.en?.bdb || '';

              // Ashtpadi section marker
              const isAshtpadi = v.header === 2 && gurmukhi.includes('ਅਸਟਪਦੀ');
              if (isAshtpadi) aatpadiCount++;
              const aatpadiNum = isAshtpadi ? aatpadiCount : 0;

              const visraamMarks = pickVisraam(v.verse?.visraam);
              const willRender =
                isAshtpadi ||
                (showGurmukhi && !!gurmukhi) || (showHindi && !!transliteration) || (showEnglish && !!translation);
              if (!willRender) return null;

              if (isAshtpadi) {
                return (
                  <View key={idx} style={styles.ashtpadiBanner}>
                    <View style={styles.ashtpadiLine} />
                    <Text style={styles.ashtpadiLabel}>ਅਸਟਪਦੀ {aatpadiNum}</Text>
                    <View style={styles.ashtpadiLine} />
                  </View>
                );
              }

              return (
                <React.Fragment key={idx}>
                  <View style={styles.verseBlock}>
                    {showGurmukhi && !!gurmukhi && (<GurmukhiWithVisraam text={gurmukhi} marks={visraamMarks} fs={fontSize} />)}
                    {showHindi && !!transliteration && (
                      <Text style={[styles.transliteration, (()=>{ const fs=Math.max(MIN_SIZE, fontSize-4); return { fontSize: fs, lineHeight: Math.ceil(fs*1.35) };})()]} maxFontSizeMultiplier={2.0}>
                        {transliteration}
                      </Text>
                    )}
                    {showEnglish && !!translation && (
                      <Text style={[styles.translation, (()=>{ const fs=Math.max(MIN_SIZE, fontSize-8); return { fontSize: fs, lineHeight: Math.ceil(fs*1.35) };})()]} maxFontSizeMultiplier={2.0}>
                        {translation}
                      </Text>
                    )}
                  </View>
                  {idx < verseCount - 1 && <View accessible style={styles.divider} />}
                </React.Fragment>
              );
            });
          })()
        ) : (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No content found for {paathName}.</Text></View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Small legend dot component */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

/** Small toggle chip component */
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
  screen: { flex: 1, backgroundColor: WASH },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: WASH },
  loadingText: { marginTop: 10, fontSize: 15, color: PRIMARY, fontFamily: 'Inter-SemiBold' },
  headerCard: {
    backgroundColor: CARD_BG, borderRadius: 16, marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center',
    borderWidth: 1, borderColor: IVORY_DEEP,
  },
  titleGurmukhi: { fontFamily: 'NotoSansGurmukhi', fontSize: 26, color: SAFFRON, textAlign: 'center', lineHeight: 38 },
  titleEnglish: { fontFamily: 'Fraunces-LightItalic', fontSize: 15, color: MUTED, textAlign: 'center', marginTop: 4 },
  headerDivider: { width: '50%', height: 1, backgroundColor: IVORY_DEEP, marginVertical: 12 },
  headerStats: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: MUTED, letterSpacing: 1.4 },
  title: { fontSize: 24, fontFamily: 'NotoSansGurmukhi', color: PRIMARY, textAlign: 'center', marginTop: 25 },
  subtitle: { fontFamily: 'Fraunces-LightItalic', fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 4, marginBottom: 12 },

  toolbar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 16, marginBottom: 8, flexWrap: 'wrap', gap: 8,
  },
  ttSmall: { fontSize: 14, fontFamily: 'Inter-Bold', color: TEAL, marginRight: 2 },
  ttLarge: { fontSize: 18, fontFamily: 'Inter-Bold', color: TEAL },
  toolbarBtns: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 8 },
  toolbarBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: TEAL, alignItems: 'center', justifyContent: 'center', backgroundColor: CARD_BG },
  toolbarBtnPressed: { opacity: 0.7 },
  toolbarBtnText: { fontSize: 18, fontFamily: 'Inter-Bold', color: TEAL, includeFontPadding: false, textAlignVertical: 'center' },
  toggleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%' },

  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipActive: { backgroundColor: TEAL, borderColor: TEAL },
  chipInactive: { backgroundColor: CARD_BG, borderColor: IVORY_DEEP },
  chipText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  chipTextActive: { color: '#FFFFFF' },
  chipTextInactive: { color: MUTED },

  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: SUBTLE, fontFamily: 'Inter-Regular' },

  verseCard: {
    backgroundColor: CARD_BG, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 5, marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  verseBlock: { paddingVertical: 14, paddingHorizontal: 16 },
  divider: { height: Math.max(1, StyleSheet.hairlineWidth * 2), backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 6, opacity: 1 },

  ashtpadiBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 20,
  },
  ashtpadiLine: { flex: 1, height: 1, backgroundColor: BORDER },
  ashtpadiLabel: {
    fontFamily: 'NotoSansGurmukhi', fontSize: 15, color: TEAL,
    fontWeight: '600', marginHorizontal: 12, letterSpacing: 0.3,
  },

  // Script styles
  gurmukhi: { fontSize: 22, lineHeight: 32, color: TEXT, marginBottom: 6, includeFontPadding: true, fontFamily: FONTS.gurmukhi as string },
  transliteration: { fontSize: 18, color: SUBTLE, marginBottom: 4, fontStyle: 'italic', fontFamily: FONTS.devanagari as string },
  translation: { fontSize: 14, color: '#3C3F44' },
  emptyCard: { backgroundColor: CARD_BG, borderRadius: 14, padding: 16, marginHorizontal: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  emptyText: { color: SUBTLE, fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'center' },
  ttLogo: { flexDirection: 'row', alignItems: 'flex-end' },
});
