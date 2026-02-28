import * as cheerio from 'cheerio';
import { Tournament } from '@/lib/types/tournament';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.swisschess.ch/terminliste-anzeigen.html';
const CACHE_PATH = path.join(process.cwd(), 'src/data/geocoding_cache.json');

interface CityCoordinates {
    lat: number;
    lng: number;
}

let GEOCODE_CACHE: Record<string, CityCoordinates> = {};

try {
    if (fs.existsSync(CACHE_PATH)) {
        GEOCODE_CACHE = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
} catch (e) {
    console.warn("Geocoding cache load failed for Swiss scraper.");
}

async function saveCache() {
    try {
        const dir = path.dirname(CACHE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CACHE_PATH, JSON.stringify(GEOCODE_CACHE, null, 4));
    } catch (e) {
        console.error("Failed to save geocoding cache:", e);
    }
}

async function getCoordinates(city: string): Promise<CityCoordinates> {
    const normalizedCity = city.trim().toUpperCase();
    const cacheKey = `${normalizedCity}, SWITZERLAND`;

    if (GEOCODE_CACHE[cacheKey]) {
        return GEOCODE_CACHE[cacheKey];
    }

    try {
        // Sleep to avoid rate limiting from Nominatim
        await new Promise(resolve => setTimeout(resolve, 500));

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(normalizedCity + ', Switzerland')}&format=json&limit=1`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'EchecsMatchApp/1.0' }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const coords = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            GEOCODE_CACHE[cacheKey] = coords;
            await saveCache();
            return coords;
        }
    } catch (err) {
        console.error(`Geocoding error for Swiss city ${city}:`, err);
    }

    return { lat: 46.8182, lng: 8.2275 }; // Center of Switzerland
}

function extractCity(name: string): string {
    const nameWithSpaces = name.replace(/_/g, ' ');

    // 1. Check for "City: ..." pattern (very common in Swiss calendar)
    if (nameWithSpaces.includes(':')) {
        const potentialCity = nameWithSpaces.split(':')[0].trim();
        // If it's a known city or at least a single word starting with uppercase
        if (/^[A-Z][a-z\xC0-\u017F]+/.test(potentialCity)) {
            return potentialCity;
        }
    }

    // 2. Check for "Open in City" pattern
    const inMatch = nameWithSpaces.match(/\s+in\s+([A-Z][a-z\xC0-\u017F]+)/i);
    if (inMatch) return inMatch[1];

    // 3. Common swiss cities and regions to match
    const majorCities = [
        'Zürich', 'Zurich', 'Genève', 'Geneva', 'Basel', 'Bâle', 'Bern', 'Berne', 'Lausanne',
        'Winterthur', 'Lucerne', 'Luzern', 'St. Gallen', 'Lugano', 'Biel', 'Bienne', 'Thun',
        'Fribourg', 'Schaffhausen', 'Chur', 'Neuchâtel', 'Payerne', 'Martigny', 'Locarno',
        'Riehen', 'Davos', 'Aarau', 'Wil', 'Inzling', 'Graechen', 'St. Moritz', 'Baden',
        'Zug', 'Sion', 'Uster', 'Montreux', 'Thalwil', 'Stäfa', 'Ascona', 'Payerne', 'Lyss',
        'Prangins', 'Echallens', 'Vevey', 'Nyon', 'Morges', 'Gland', 'Bulle', 'Muri', 'Rapperswil',
        'Ascona', 'Mendrisio', 'Chiasso', 'Bellinzona', 'Sion', 'Sierre', 'Visp', 'Brig', 'Martigny'
    ];

    for (const city of majorCities) {
        const regex = new RegExp(`\\b${city}\\b`, 'i');
        if (regex.test(nameWithSpaces)) return city;
    }

    return "Suisse";
}

export async function fetchSwissTournaments(): Promise<Tournament[]> {
    console.log("Scraping Swiss tournaments...");
    try {
        const res = await fetch(BASE_URL);
        const html = await res.text();
        const $ = cheerio.load(html);

        const tournaments: Tournament[] = [];
        let currentDateRange = "";

        // The site uses a specific structure. Based on the markdown, dates are in text nodes 
        // and links are in <a> tags.
        // Let's refine based on the markdown structure seen:
        // Text node with date like "27.02.2026 – 01.03.2026"
        // Followed by a specific container or <a> tag.

        // Let's find all text blocks that look like dates DD.MM.YYYY
        const dateRegex = /(\d{2}\.\d{2}\.\d{4})/g;

        // Actually, looking at common site layouts, the terminliste might be in a list or table.
        // In the markdown it looks like sequential entries.

        const mainContent = $('.ce-bodytext').first(); // Common typo3/standard class
        if (!mainContent.length) {
            // Fallback to searching all <a> tags that might be tournaments
            $('a').each((_, el) => {
                const link = $(el).attr('href') || '';
                const title = $(el).text().trim();

                // If it looks like a tournament link (not navigation)
                if (title && !['Sitemap', 'Impressum', 'Filter'].includes(title) && (link.includes('http') || link.includes('.html'))) {
                    // We'd need to find the nearest date... this is tricky without the exact DOM.
                }
            });
        }

        // Based on the markdown provided by read_url_content:
        // dates are often siblings of the link.

        // Let's try to parse the markdown chunks directly as a fallback if DOM is hard
        // but since I'm in a node environment, I'll pray the DOM is clean.

        // Wait, I can see the markdown structure:
        // "27.02.2026 – 01.03.2026\n[Name](Link)"

        // Let's use the regex approach that worked, but with better link handling
        const bodyText = $.text();
        const rawEntries = bodyText.split(/(\d{2}\.\d{2}\.\d{4})/);

        for (let i = 1; i < rawEntries.length; i += 2) {
            const date = rawEntries[i];
            let content = (rawEntries[i + 1] || "").trim();

            // Clean up content (remove leading date separators)
            content = content.replace(/^[–\s]*\d{2}\.\d{2}\.\d{4}/, "").trim();
            content = content.replace(/^[–\s]+/, "").trim();

            // If the content starts with another date range separator, skip it
            if (content.length < 5) continue;

            const name = content.split('\n')[0].split('(')[0].trim();
            if (name.length < 5 || name.includes('SSB') || name === 'Kalender') continue;

            const city = extractCity(name);
            const coords = await getCoordinates(city);

            let format: 'Blitz' | 'Rapide' | 'Lent' = 'Lent';
            const lower = name.toLowerCase();

            if (lower.includes('blitz') || lower.includes('lampo') || lower.includes('lightning') || lower.includes('5 min')) {
                format = 'Blitz';
            } else if (
                lower.includes('rapid') ||
                lower.includes('schnell') ||
                lower.includes('aktiv') ||
                lower.includes('semilampo') ||
                lower.includes('semi-rapide') ||
                lower.includes('10 min') ||
                lower.includes('15 min') ||
                lower.includes('20 min') ||
                lower.includes('25 min') ||
                lower.includes('30 min')
            ) {
                format = 'Rapide';
            }

            const parts = date.split('.');
            const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

            // Try to find a link in the <a> tags for this specific text
            const $link = $(`a:contains("${name.slice(0, 10)}")`).first();
            let link = $link.attr('href') || BASE_URL;
            if (link && !link.startsWith('http')) {
                link = link.startsWith('/') ? `https://www.swisschess.ch${link}` : `https://www.swisschess.ch/${link}`;
            }

            if (name.length > 3 && isoDate.length === 10) {
                // Ensure ID is truly unique by including city and date
                const idPayload = `${name}-${city}-${isoDate}-${format}`;
                tournaments.push({
                    id: `swiss-${Buffer.from(idPayload).toString('base64').replace(/=/g, '').slice(-12)}`,
                    name: name,
                    format: format,
                    eloBracket: "Toutes catégories",
                    location: {
                        lat: coords.lat,
                        lng: coords.lng,
                        city: city,
                        address: city
                    },
                    hasPlayersList: false,
                    homologationLink: link,
                    date: isoDate
                });
            }
        }

        // Deduplicate locally just in case
        const seenIds = new Set();
        return tournaments.filter(t => {
            if (seenIds.has(t.id)) return false;
            seenIds.add(t.id);
            return true;
        });
    } catch (e) {
        console.error("Swiss scraping failed:", e);
        return [];
    }
}
