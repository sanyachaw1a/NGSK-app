// PaathDetail.tsx
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
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './_layout';

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

const bhagatBaniTokens = [
  'salokkabir',
  'salokfareed',
  'baavanakhrikabirjee',
  'tilang',
  'toddee',
  'sriraag',
];

const svaiyes = ['sirimukhbaakm1a', 'sirimukhbaakm1b', 'svaiyem1', 'svaiyem2', 'svaiyem3', 'svaiyem4', 'svaiyem5'];

/** ---- CONFIG for /angs endpoint (BaniDB) ---- */
const ANGS_BASE = 'https://api.banidb.com/v2';
const SAHASKRITI_PAGES = [1353, 1354, 1355, 1356, 1357, 1358, 1359, 1360];
const SOURCE_ID = 'G';

export default function PaathDetail() {
  const route = useRoute<PaathDetailRouteProp>();
  const { paathName } = route.params;

  const [loading, setLoading] = useState(true);
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ===== Font size controls (toolbar, not floating) =====
  const [fontSize, setFontSize] = useState(22); // base for Gurmukhi
  const MIN_SIZE = 12;
  const MAX_SIZE = 40;

  // ===== Visibility toggles =====
  const [showGurmukhi, setShowGurmukhi] = useState(true);
  const [showHindi, setShowHindi] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);

  // Announce changes without numbers (per request)
  const announceSize = (dir: 'larger' | 'smaller') => {
    AccessibilityInfo.announceForAccessibility?.(
      dir === 'larger' ? 'Text larger' : 'Text smaller'
    );
  };
  const increaseFont = () => {
    setFontSize((s) => {
      const next = Math.min(MAX_SIZE, s + 2);
      if (next !== s) announceSize('larger');
      return next;
    });
  };
  const decreaseFont = () => {
    setFontSize((s) => {
      const next = Math.max(MIN_SIZE, s - 2);
      if (next !== s) announceSize('smaller');
      return next;
    });
  };

  const paathToToken: Record<string, string | string[]> = {
    'Japji Sahib': 'japji',
    'Sukhmani Sahib': 'sukhmani',
    'Shlok Mahala 9': 'salokm9',
    'Kirtan Sohila': 'sohila',
    'Shabad Hazare': 'shabadhazare',
    'Anand Sahib': 'anand',
    'Chaupai Sahib': 'chaupai',
    'Rehraas Sahib': 'rehras',
    'Barah Maha Manjh': 'baarehmaha',
    'Aarti': 'aarti',
    'Sidh Gosht': 'sidhgosht',
    'Bavan Akhri': 'bavanakhree',
    'Dakhni Oankar': 'dhakhnioankar',
    'Dukh Banjani Sahib': 'dukhbhanjani',
    'Asa Di Vaar': 'asadivar',
    'Savaiye': svaiyes,
    'Bhagat Bani': bhagatBaniTokens,
    'Bai Vaaran': 'vaarkabirjee',
    // Keep a token for fallback, but we’ll prefer /angs for this one:
    'Sahaskriti Shlok': 'sahas_kriti',
  };

  /** Fetch Sahaskriti via BaniDB /angs (GGS Angs 1353–1360) and filter to Salok Sehskritee only */
  const fetchSahaskritiFromAngs = async (): Promise<VerseData[]> => {
    const out: VerseData[] = [];

    for (const page of SAHASKRITI_PAGES) {
      const res = await fetch(`${ANGS_BASE}/angs/${page}/${SOURCE_ID}`);
      const data = await res.json();

      // Common shapes seen on this endpoint
      const lines: any[] =
        (Array.isArray(data?.page) && data.page) ||
        (Array.isArray(data?.lines) && data.lines) ||
        (Array.isArray(data?.result) && data.result) ||
        [];

      lines
        // keep only Salok Sehskritee (account for variations)
        .filter((ln) => {
          const en =
            (ln?.raag?.english ||
              ln?.line?.raag?.english ||
              ln?.meta?.raag?.english ||
              ln?.section?.english ||
              '')
              .toString()
              .toLowerCase();
          const gu =
            (ln?.raag?.gurmukhi ||
              ln?.line?.raag?.gurmukhi ||
              ln?.meta?.gurmukhi ||
              ln?.section?.gurmukhi ||
              '')
              .toString();

          return (
            en.includes('sehskritee') ||
            en.includes('sahaskriti') ||
            gu.includes('shsik') || // e.g. "slok shsik®qI"
            gu.includes('ਸਹਸਕ੍ਰਿਤੀ')
          );
        })
        // normalize to VerseData shape (no visraam data on /angs)
        .forEach((ln) => {
          const gurmukhi =
            ln?.verse?.unicode ||
            ln?.line?.gurmukhi?.unicode ||
            ln?.gurmukhi?.unicode ||
            ln?.gurmukhi ||
            '';

          const transliteration =
            ln?.transliteration?.hindi ||
            ln?.transliteration?.en ||
            ln?.transliteration?.english ||
            '';

          const enTrans =
            ln?.translation?.en?.ssk ||
            ln?.translation?.en?.ms ||
            ln?.translation?.en?.bdb ||
            ln?.translation?.english ||
            '';

          out.push({
            verse: {
              verse: { unicode: gurmukhi },
              transliteration: { hindi: transliteration },
              translation: { en: { ssk: enTrans } },
              // visraam not present on /angs
            },
          });
        });
    }

    return out;
  };

  useEffect(() => {
    let cancelled = false;

    const fetchBani = async () => {
      setLoading(true);
      setError(null);

      try {
        // Sahaskriti uses /angs pages
        if (paathName === 'Sahaskriti Shlok' || paathName === 'Sahaskriti Salok') {
          const v = await fetchSahaskritiFromAngs();
          if (!cancelled) setVerses(v);
          return;
        }

        // Default: use BaniDB Bani-by-token flow
        const tokens = paathToToken[paathName];
        if (!tokens) {
          if (!cancelled) {
            setError(`No token found for ${paathName}`);
            setVerses([]);
          }
          return;
        }

        const tokenList = Array.isArray(tokens) ? tokens : [tokens];

        const listRes = await fetch('https://api.banidb.com/v2/banis');
        const listData = await listRes.json();

        let all: VerseData[] = [];
        for (const token of tokenList) {
          const bani = listData.find((b: any) => b.token === token);
          if (!bani) continue;

          const detailRes = await fetch(`https://api.banidb.com/v2/banis/${bani.ID}`);
          const detailData = await detailRes.json();
          if (Array.isArray(detailData?.verses)) {
            // detailData.verses include visraam objects; keep them
            all = all.concat(detailData.verses as VerseData[]);
          }
        }
        if (!cancelled) setVerses(all);
      } catch (e) {
        if (!cancelled) {
          setError('There was a problem fetching this paath. Please try again.');
          setVerses([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBani();
    return () => {
      cancelled = true;
    };
  }, [paathName]);

  const verseCount = useMemo(() => verses.length, [verses]);

  /** ===== Visraam helpers ===== */
  const VISRAAM_COLORS: Record<string, string> = {
    v: '#c54949ff', // strong pause
    y: '#e28324ff', // medium pause
    m: '#69a33fff', // light/mini pause (fallback if ever present)
  };

  const pickVisraam = (v?: Visraam): VisraamMark[] => {
    if (!v) return [];
    // sttm2 is now the default
    if (v.igurbani && v.igurbani.length) return v.igurbani;
    if (v.sttm && v.sttm.length) return v.sttm;
    if (v.sttm2 && v.sttm2.length) return v.sttm2;
    return [];
  };

  const GurmukhiWithVisraam = ({
    text,
    marks,
    fs,
  }: {
    text: string;
    marks: VisraamMark[];
    fs: number;
  }) => {
    const words = text.split(/\s+/);
    const map = new Map<number, string>();
    marks.forEach((m) => {
      const idx = typeof m.p === 'string' ? parseInt(m.p, 10) : m.p;
      if (!Number.isNaN(idx)) map.set(idx, m.t);
    });

    const base = {
      fontSize: fs,
      lineHeight: Math.ceil(fs * 1.5),
      color: TEXT,
      paddingVertical: 2,
      includeFontPadding: true,
    } as const;

    return (
      <Text style={[styles.gurmukhi, base]} maxFontSizeMultiplier={2.2}>
        {words.map((w, i) => {
          const t = map.get(i);
          const colored = t && VISRAAM_COLORS[t];
          const piece = w + (i < words.length - 1 ? ' ' : '');
          return (
            <Text key={i} style={colored ? { color: colored, fontWeight: '700' } : undefined}>
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
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]} // extra space so last line isn't clipped
        showsVerticalScrollIndicator={true}
        scrollIndicatorInsets={{ right: 1 }}
      >
        <Text style={styles.title}>{paathName}</Text>
        <Text style={styles.subtitle}>
          {verseCount > 0 ? `${verseCount} verses` : 'No verses available'}
        </Text>

        {/* Toolbar (TT + toggles) */}
        <View style={styles.toolbar} accessibilityRole="toolbar" accessible>
          <View style={styles.ttLogo}>
            <Text style={styles.ttSmall}>T</Text>
            <Text style={styles.ttLarge}>T</Text>
          </View>

          <View style={styles.toolbarBtns}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease text size"
              onPress={decreaseFont}
              style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]}
              hitSlop={8}
            >
              <Text style={styles.toolbarBtnText} allowFontScaling={false}>−</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase text size"
              onPress={increaseFont}
              style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]}
              hitSlop={8}
            >
              <Text style={styles.toolbarBtnText} allowFontScaling={false}>+</Text>
            </Pressable>
          </View>

          {/* Visibility toggle chips */}
          <View style={styles.toggleGroup} accessibilityRole="tablist">
            <ToggleChip
              label="Gurmukhi"
              active={showGurmukhi}
              onPress={() => setShowGurmukhi((v) => !v)}
            />
            <ToggleChip
              label="Hindi"
              active={showHindi}
              onPress={() => setShowHindi((v) => !v)}
            />
            <ToggleChip
              label="English"
              active={showEnglish}
              onPress={() => setShowEnglish((v) => !v)}
            />
          </View>
        </View>

        {/* Legend for visraam colours (only if Gurmukhi is visible) */}
        {showGurmukhi && (
          <View style={styles.legendRow} accessible accessibilityLabel="Pause legend">
            <LegendDot color={VISRAAM_COLORS.v} label="Strong pause (v)" />
            <LegendDot color={VISRAAM_COLORS.y} label="Medium pause (y)" />
            <LegendDot color={VISRAAM_COLORS.m} label="Light pause (m)" />
          </View>
        )}

        {error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : verseCount > 0 ? (
          verses.map((v, idx) => {
            const gurmukhi = v.verse?.verse?.unicode || v.verse?.verse?.gurmukhi || '';
            const transliteration = v.verse?.transliteration?.hindi || '';
            const translation =
              v.verse?.translation?.en?.ssk ||
              v.verse?.translation?.en?.ms ||
              v.verse?.translation?.en?.bdb ||
              '';

            const visraamMarks = pickVisraam(v.verse?.visraam);

            // Determine if anything will render for this verse
            const willRender =
              (showGurmukhi && !!gurmukhi) ||
              (showHindi && !!transliteration) ||
              (showEnglish && !!translation);

            if (!willRender) return null;

            return (
              <View key={idx} style={styles.verseCard}>
                {showGurmukhi && !!gurmukhi && (
                  <GurmukhiWithVisraam text={gurmukhi} marks={visraamMarks} fs={fontSize} />
                )}

                {showHindi && !!transliteration && (
                  <Text
                    style={[
                      styles.transliteration,
                      (() => {
                        const fs = Math.max(MIN_SIZE, fontSize - 4);
                        return { fontSize: fs, lineHeight: Math.ceil(fs * 1.35) };
                      })(),
                    ]}
                    maxFontSizeMultiplier={2.0}
                  >
                    {transliteration}
                  </Text>
                )}

                {showEnglish && !!translation && (
                  <Text
                    style={[
                      styles.translation,
                      (() => {
                        const fs = Math.max(MIN_SIZE, fontSize - 8);
                        return { fontSize: fs, lineHeight: Math.ceil(fs * 1.35) };
                      })(),
                    ]}
                    maxFontSizeMultiplier={2.0}
                  >
                    {translation}
                  </Text>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No content found for {paathName}.</Text>
          </View>
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
function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`Toggle ${label}`}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        pressed && { opacity: 0.75 },
      ]}
      hitSlop={6}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ===== Theme (purple, light UI) ===== */
const PRIMARY = '#8076BE';
const BORDER = 'rgba(128, 118, 190, 0.26)';
const WASH = '#F5F3FF';
const CARD_BG = '#FFFFFF';
const TEXT = '#1F2328';
const SUBTLE = '#6B7280';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WASH,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  scroll: { flex: 1 },
  content: {
    paddingBottom: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: WASH,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: PRIMARY,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
    marginTop: 25,
  },
  subtitle: {
    fontSize: 13,
    color: PRIMARY,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    fontWeight: '700',
    opacity: 0.85,
  },

  /* Toolbar (non-floating) */
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 15,
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  ttSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: PRIMARY,
    marginRight: 2,
  },
  ttLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
  },
  toolbarBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 8,
  },
  toolbarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  toolbarBtnPressed: {
    opacity: 0.7,
  },
  toolbarBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextInactive: {
    color: PRIMARY,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: SUBTLE,
  },

  verseCard: {
    backgroundColor: '#f7f6fcff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 5,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gurmukhi: {
    fontSize: 22, // base; overridden dynamically
    lineHeight: 32,
    color: TEXT,
    marginBottom: 6,
    includeFontPadding: true, // helps prevent clipping on Android
  },
  transliteration: {
    fontSize: 18, // base; overridden dynamically
    color: SUBTLE,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  translation: {
    fontSize: 14, // base; overridden dynamically
    color: '#3C3F44',
  },
  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  emptyText: {
    color: SUBTLE,
    fontSize: 14,
    textAlign: 'center',
  },
  ttLogo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
