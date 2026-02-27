import { fetchLiveTournaments } from '../src/lib/api/ffeScraper';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("🚀 Starting FFE Global Scrape...");

    try {
        const tournaments = await fetchLiveTournaments();

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
        console.log(`📊 Total tournaments saved: ${tournaments.length}`);
        console.log(`📂 File saved to: ${dataPath}`);
    } catch (error) {
        console.error("❌ Scraping failed:", error);
        process.exit(1);
    }
}

main();
