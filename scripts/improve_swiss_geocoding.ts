import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.join(__dirname, '../src/data/tournaments.json');

const CUSTOM_MAPPINGS: Record<string, string> = {
    'MÜNCHEN': 'Munich, Germany',
    'Budva': 'Budva, Montenegro',
    'Mitropacup': 'St. Veit an der Glan, Austria',
    'Swiss Young Masters': 'Basel, Switzerland',
    'SJEM': 'Olten, Switzerland', // Often in Olten
    'BUNDESTURNIER': 'Bern, Switzerland', // Often in Bern
    'Gex': 'Gex, France',
    'Open du Jura': 'Delémont, Switzerland'
};

async function geocode(query: string) {
    console.log(`Geocoding ${query}...`);
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'EchecsMatchGeolocationScript/1.0'
            }
        });
        const data = await response.json() as any[];
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                city: query.split(',')[0],
                address: query
            };
        }
    } catch (error) {
        console.error(`Error geocoding ${query}:`, error);
    }
    return null;
}

async function run() {
    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(rawData);
    const tournaments = data.tournaments;

    let updatedCount = 0;

    for (let i = 0; i < tournaments.length; i++) {
        const t = tournaments[i];
        if (t.id.startsWith('swiss-') && (t.location.city === 'Suisse' || t.location.address === 'Suisse')) {
            let query: string | null = null;

            for (const [key, val] of Object.entries(CUSTOM_MAPPINGS)) {
                if (t.name.toLowerCase().includes(key.toLowerCase())) {
                    query = val;
                    break;
                }
            }

            if (query) {
                const geo = await geocode(query);
                if (geo) {
                    t.location = geo;
                    updatedCount++;
                    await new Promise(resolve => setTimeout(resolve, 1100));
                }
            }
        }
    }

    if (updatedCount > 0) {
        data.lastUpdate = new Date().toISOString();
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated ${updatedCount} Swiss tournaments locations.`);
    } else {
        console.log("No Swiss tournaments updated.");
    }
}

run().catch(console.error);
