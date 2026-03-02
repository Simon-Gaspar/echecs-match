import { fetchLiveTournaments } from '../src/lib/api/ffeScraper';
import { fetchSwissTournaments } from '../src/lib/api/swissScraper';
import { fetchItalianTournaments } from '../src/lib/api/italyScraper';
import { fetchSpanishTournaments } from '../src/lib/api/spainScraper';
import { fetchBelgianTournaments } from '../src/lib/api/belgiumScraper';
import { fetchLuxembourgTournaments } from '../src/lib/api/luxembourgScraper';
import { fetchGermanTournaments } from '../src/lib/api/germanyScraper';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("🚀 Starting Global Scrape (FR + CH + IT + ES + BE + LU + DE)...");

    try {
        const [ffe, swiss, italy, spain, belgium, luxembourg, germany] = await Promise.all([
            fetchLiveTournaments(),
            fetchSwissTournaments(),
            fetchItalianTournaments(),
            fetchSpanishTournaments(),
            fetchBelgianTournaments(),
            fetchLuxembourgTournaments(),
            fetchGermanTournaments()
        ]);

        const tournaments = [...ffe, ...swiss, ...italy, ...spain, ...belgium, ...luxembourg, ...germany];

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
        console.log(`📊 Total: ${tournaments.length} (FR: ${ffe.length}, CH: ${swiss.length}, IT: ${italy.length}, ES: ${spain.length}, BE: ${belgium.length}, LU: ${luxembourg.length}, DE: ${germany.length})`);
        console.log(`📂 File saved to: ${dataPath}`);
    } catch (error) {
        console.error("❌ Scraping failed:", error);
        process.exit(1);
    }
}

main();

