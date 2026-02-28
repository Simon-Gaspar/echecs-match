import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.join(__dirname, '../src/data/tournaments.json');

const SWISS_CITIES = [
    'Zürich', 'Genève', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel', 'Thun', 'Bellinzona', 'Köniz', 'Fribourg', 'La Chaux-de-Fonds', 'Schaffhausen', 'Chur', 'Vernier', 'Neuchâtel', 'Uster', 'Sion', 'Lancy', 'Emmen', 'Yverdon-les-Bains', 'Zug', 'Kriens', 'Rapperswil-Jona', 'Dübendorf', 'Dietikon', 'Montreux', 'Frauenfeld', 'Wetzikon', 'Wil', 'Baar', 'Meyrin', 'Bulle', 'Kreuzlingen', 'Wädenswil', 'Carouge', 'Riehen', 'Renens', 'Aarau', 'Allschwil', 'Wettingen', 'Horgen', 'Nyon', 'Vevey', 'Gossau', 'Reinach', 'Muttenz', 'Onex', 'Olten', 'Baden', 'Pully', 'Littau', 'Thalwil', 'Adliswil', 'Grenchen', 'Regensdorf', 'Monthey', 'Herisau', 'Volketswil', 'Davos', 'St. Moritz', 'Lenzerheide', 'Flims', 'Arosa', 'Gstaad', 'Mendrisio', 'Chiasso', 'Locarno', 'Ascona', 'Bellinzona', 'Bad Ragaz', 'Scuol', 'Pontresina', 'Adelboden', 'Grächen', 'Zermatt', 'Andermatt', 'Engelberg', 'Klosters', 'Murten', 'Estavayer-le-Lac', 'Payerne', 'Morges', 'Rolle', 'Aubonne', 'Cossonay', 'Echallens', 'Orbe', 'Yverdon', 'Ste-Croix', 'Vallorbe', 'Bex', 'Villeneuve', 'Aigle', 'Leysin', 'Les Diablerets', 'Villars', 'Gryon', 'St-Cergue', 'Crans-Montana', 'Anzère', 'Leukerbad', 'Saas-Fee', 'Visp', 'Brig', 'Martigny', 'Sierre', 'Champery', 'Verbier', 'San Bernardino', 'Gex', 'Delémont', 'Porrentruy', 'Saignelégier', 'Laufen', 'Solothurn', 'Olten', 'Langenthal', 'Burgdorf', 'Interlaken', 'Spiez', 'Brienz', 'Meiringen', 'Hasliberg', 'Grindelwald', 'Wengen', 'Mürren', 'Lauterbrunnen', 'Kandersteg', 'Frutigen', 'Lenk', 'Zweisimmen', 'Saanen', 'Gstaad', 'Rougemont', 'Château-d\'Oex', 'Rossinière', 'Paradiso'
];

const CUSTOM_MAPPINGS: Record<string, string> = {
    'ZUERCHER': 'Zürich',
    'ZÜRICHSEE': 'Zürich',
    'Jura': 'Delémont',
    'Engadiner': 'Samedan',
    'Bodensee': 'Kreuzlingen',
    'BVM': 'Bern',
    'Paradiso': 'Paradiso, Lugano'
};

async function geocode(city: string) {
    console.log(`Geocoding ${city}...`);
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Switzerland')}&format=json&limit=1`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'EchecsMatchGeolocationScript/1.1'
            }
        });
        const data = await response.json() as any[];
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                city: city.split(',')[0].trim(),
                address: city
            };
        }
    } catch (error) {
        console.error(`Error geocoding ${city}:`, error);
    }
    return null;
}

function extractCityFromText(text: string): string | null {
    if (!text) return null;

    // Check custom mappings first
    for (const [key, val] of Object.entries(CUSTOM_MAPPINGS)) {
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(text)) {
            return val;
        }
    }

    // 1. Try exact matches from city list
    for (const city of SWISS_CITIES) {
        const regex = new RegExp(`\\b${city}\\b`, 'i');
        if (regex.test(text)) {
            return city;
        }
    }

    return null;
}

async function run() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error("Data file not found!");
        return;
    }

    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(rawData);
    const tournaments = data.tournaments;

    let updatedCount = 0;

    for (let i = 0; i < tournaments.length; i++) {
        const t = tournaments[i];
        if (!t.id.startsWith('swiss-')) continue;

        // If it's already specific (not "Suisse"), we only update if it's Paradiso (vulnerability we found)
        // or if it was geocoded to Basel but mentions Lugano/Paradiso
        const isSuspiciousBasel = t.location.city === 'Basel' && (t.name.includes('LUGANO') || t.name.includes('PARADISO'));
        const needsUpdate = t.location.city === 'Suisse' || isSuspiciousBasel;

        if (needsUpdate) {
            let foundCity: string | null = extractCityFromText(t.name);

            // Try parsing the homologation link but avoid the "basel_carnival" trap if the name says otherwise
            if (!foundCity && t.homologationLink) {
                const urlParts = t.homologationLink.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const cityFromUrl = extractCityFromText(fileName.replace(/[_-]/g, ' '));

                // Only trust the URL if the name doesn't contradict it
                if (cityFromUrl && !isSuspiciousBasel) {
                    foundCity = cityFromUrl;
                }
            }

            if (foundCity) {
                const geo = await geocode(foundCity);
                if (geo) {
                    t.location = geo;
                    updatedCount++;
                    // Sleep to respect Nominatim rate limits
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
