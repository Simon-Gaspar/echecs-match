import { fetchLiveTournaments } from '../src/lib/api/ffeScraper';
import { fetchSwissTournaments } from '../src/lib/api/swissScraper';
import { fetchItalianTournaments } from '../src/lib/api/italyScraper';
import { fetchSpanishTournaments } from '../src/lib/api/spainScraper';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("🚀 Starting Global Scrape (FFE + Switzerland + Italy + Spain)...");

    try {
        const [ffeTournaments, swissTournaments, italianTournaments, spanishTournaments] = await Promise.all([
            fetchLiveTournaments(),
            fetchSwissTournaments(),
            fetchItalianTournaments(),
            fetchSpanishTournaments()
        ]);

        const tournaments = [...ffeTournaments, ...swissTournaments, ...italianTournaments, ...spanishTournaments];

        const dataPath = path.join(process.cwd(), 'src/data/tournaments.json');
        const dir = path.dirname(dataPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const data = {
            lastUpdate: new Date().toISOString(),
            tournaments: tournaments
        };

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        console.log(`\n✅ Scrape complete!`);
        console.log(`📊 Total tournaments saved: ${tournaments.length} (FFE: ${ffeTournaments.length}, Swiss: ${swissTournaments.length}, Italy: ${italianTournaments.length}, Spain: ${spanishTournaments.length})`);
        console.log(`📂 File saved to: ${dataPath}`);
    } catch (error) {
        console.error("❌ Scraping failed:", error);
        process.exit(1);
    }
}

main();

