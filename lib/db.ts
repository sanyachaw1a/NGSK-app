import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('ngsk.db');
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paath_token TEXT NOT NULL,
      verse_order INTEGER NOT NULL,
      gurmukhi_unicode TEXT,
      gurmukhi_raw TEXT,
      larivaar_unicode TEXT,
      transliteration_hindi TEXT,
      transliteration_english TEXT,
      translation_en_bdb TEXT,
      translation_en_ms TEXT,
      translation_en_ssk TEXT,
      visraam_json TEXT,
      page_no INTEGER,
      line_no INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_verses_token ON verses(paath_token, verse_order);
    CREATE TABLE IF NOT EXISTS paath_meta (
      token TEXT PRIMARY KEY,
      seeded_at INTEGER NOT NULL,
      verse_count INTEGER NOT NULL DEFAULT 0
    );
  `);
  return _db;
}

export interface VerseRow {
  id: number;
  paath_token: string;
  verse_order: number;
  gurmukhi_unicode: string | null;
  gurmukhi_raw: string | null;
  larivaar_unicode: string | null;
  transliteration_hindi: string | null;
  transliteration_english: string | null;
  translation_en_bdb: string | null;
  translation_en_ms: string | null;
  translation_en_ssk: string | null;
  visraam_json: string | null;
  page_no: number | null;
  line_no: number | null;
}

/** Query verses for one or more tokens, preserving token order. */
export async function getVersesByTokens(tokens: string[]): Promise<VerseRow[]> {
  const db = await getDatabase();
  const result: VerseRow[] = [];
  for (const token of tokens) {
    const rows = await db.getAllAsync<VerseRow>(
      'SELECT * FROM verses WHERE paath_token = ? ORDER BY verse_order',
      [token]
    );
    result.push(...rows);
  }
  return result;
}

export async function isTokenSeeded(token: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ token: string }>(
    'SELECT token FROM paath_meta WHERE token = ?',
    [token]
  );
  return row !== null;
}

/** Insert all verses for a token in a single transaction. */
export async function seedToken(token: string, rawVerses: any[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < rawVerses.length; i++) {
      const v = rawVerses[i];
      const verse = v?.verse;
      await db.runAsync(
        `INSERT INTO verses
          (paath_token, verse_order, gurmukhi_unicode, gurmukhi_raw, larivaar_unicode,
           transliteration_hindi, transliteration_english,
           translation_en_bdb, translation_en_ms, translation_en_ssk,
           visraam_json, page_no, line_no)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          token,
          i,
          verse?.verse?.unicode ?? null,
          verse?.verse?.gurmukhi ?? null,
          verse?.larivaar?.unicode ?? null,
          verse?.transliteration?.hindi ?? null,
          verse?.transliteration?.english ?? null,
          verse?.translation?.en?.bdb ?? null,
          verse?.translation?.en?.ms ?? null,
          verse?.translation?.en?.ssk ?? null,
          verse?.visraam ? JSON.stringify(verse.visraam) : null,
          verse?.pageNo ?? null,
          verse?.lineNo ?? null,
        ]
      );
    }
    await db.runAsync(
      'INSERT OR REPLACE INTO paath_meta (token, seeded_at, verse_count) VALUES (?, ?, ?)',
      [token, Date.now(), rawVerses.length]
    );
  });
}
