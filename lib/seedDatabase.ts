import { isTokenSeeded, seedToken } from './db';

/**
 * Maps each SQLite token to its local JSON asset.
 * Savaiye and Bhagat Bani use single combined files instead of
 * the split sub-tokens that were never available locally.
 */
const TOKEN_ASSETS: Record<string, any> = {
  japji:            require('../assets/paath/japji.json'),
  sukhmani:         require('../assets/paath/sukhmani.json'),
  salokm9:          require('../assets/paath/salokm9.json'),
  sohila:           require('../assets/paath/sohila.json'),
  shabadhazare:     require('../assets/paath/shabadhazare.json'),
  anand:            require('../assets/paath/anand.json'),
  chaupai:          require('../assets/paath/chaupai.json'),
  rehras:           require('../assets/paath/rehras.json'),
  baarehmaha:       require('../assets/paath/baarehmaha.json'),
  aarti:            require('../assets/paath/aarti.json'),
  sidhgosht:        require('../assets/paath/sidhgosht.json'),
  bavanakhree:      require('../assets/paath/bavanakhree.json'),
  dhakhnioankar:    require('../assets/paath/dhakhnioankar.json'),
  dukhbhanjani:     require('../assets/paath/dukhbhanjani.json'),
  asadivar:         require('../assets/paath/asadivar.json'),
  vaarkabirjee:     require('../assets/paath/vaarkabirjee.json'),
  sahaskriti_shlok: require('../assets/paath/sahaskriti_shlok.json'),
  savaiye:          require('../assets/paath/savaiye.json'),
  bhagatbani:       require('../assets/paath/bhagat_bani_-_shlok_kabir_ji_ke.json'),
};

/**
 * Seeds all paaths into SQLite on first launch.
 * Skips any token that is already seeded — safe to call repeatedly.
 * Runs asynchronously and does NOT block the UI.
 */
export async function seedAllPaaths(): Promise<void> {
  for (const [token, mod] of Object.entries(TOKEN_ASSETS)) {
    if (await isTokenSeeded(token)) continue;
    const verses: any[] | undefined =
      Array.isArray(mod?.verses) ? mod.verses : mod?.default?.verses;
    if (!verses?.length) {
      console.warn(`[seedDatabase] No verses found for token: ${token}`);
      continue;
    }
    try {
      await seedToken(token, verses);
    } catch (err) {
      console.warn(`[seedDatabase] Failed to seed ${token}:`, err);
    }
  }
}
