import { fetchSwissTournaments } from './src/lib/api/swissScraper';

async function test() {
    console.log("Testing Swiss Scraper...");
    const tournaments = await fetchSwissTournaments();
    console.log(`Found ${tournaments.length} tournaments.`);
    if (tournaments.length > 0) {
        console.log("First 3 tournaments:");
        console.log(JSON.stringify(tournaments.slice(0, 3), null, 2));
    }
}

test().catch(console.error);
