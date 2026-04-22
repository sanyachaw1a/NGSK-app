import { isTokenSeeded, seedToken } from './db';

/**
 * Maps each SQLite token to its local JSON asset.
 * Savaiye and Bhagat Bani use single combined files instead of
 * the split sub-tokens that were never available locally.
 */
const TOKEN_ASSETS: Record<string, any> = {
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
  // Bhagat Bani raags (BaniDB IDs 55–76)
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
