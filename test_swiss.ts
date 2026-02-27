import { fetchSwissTournaments } from './src/lib/api/swissScraper';

async function test() {
    console.log("Testing Swiss Scraper again...");
    try {
        const results = await fetchSwissTournaments();
        console.log(`Success! Found ${results.length} tournaments.`);
        if (results.length > 0) {
            console.log("Random sample:", JSON.stringify(results[Math.floor(Math.random() * results.length)], null, 2));
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
