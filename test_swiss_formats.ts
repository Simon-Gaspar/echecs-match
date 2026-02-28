import { fetchSwissTournaments } from './src/lib/api/swissScraper';

async function test() {
    console.log("Testing Swiss Scraper Formats...");
    const tournaments = await fetchSwissTournaments();
    const formats = tournaments.reduce((acc: any, t) => {
        acc[t.format] = (acc[t.format] || 0) + 1;
        return acc;
    }, {});
    console.log("Formats found:", formats);

    const rapidOrBlitz = tournaments.filter(t => t.format !== 'Lent');
    if (rapidOrBlitz.length > 0) {
        console.log("Samples of non-lent tournaments:");
        console.log(JSON.stringify(rapidOrBlitz.slice(0, 5), null, 2));
    } else {
        console.log("NO RAPID OR BLITZ FOUND.");
        // Let's print some titles to see if we missed anything
        console.log("First 20 titles:");
        tournaments.slice(0, 20).forEach(t => console.log(`- ${t.name}`));
    }
}

test().catch(console.error);
