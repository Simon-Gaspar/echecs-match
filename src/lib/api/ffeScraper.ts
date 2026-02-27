import * as cheerio from 'cheerio';
import { Tournament } from '@/lib/types/tournament';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://www.echecs.asso.fr/ListeTournois.aspx';
const CACHE_PATH = path.join(process.cwd(), 'src/data/geocoding_cache.json');

interface CityCoordinates {
    lat: number;
    lng: number;
}

let GEOCODE_CACHE: Record<string, CityCoordinates> = {};

// Load cache once
try {
    if (fs.existsSync(CACHE_PATH)) {
        GEOCODE_CACHE = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
} catch (e) {
    console.warn("Geocoding cache not found or invalid. Starting with empty cache.");
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

    if (GEOCODE_CACHE[normalizedCity]) {
        return GEOCODE_CACHE[normalizedCity];
    }

    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(normalizedCity + ', France')}&format=json&limit=1`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'EchecsMatchApp/1.0' }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const coords = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            GEOCODE_CACHE[normalizedCity] = coords;
            // Immediate save for persistence (throttle might be better but let's be simple for now)
            await saveCache();
            return coords;
        }
    } catch (err) {
        console.error(`Geocoding error for ${city}:`, err);
    }

    return { lat: 46.2276, lng: 2.2137 };
}

async function fetchRegisteredCount(ref: string): Promise<{ count: number | undefined, listUrl: string | null }> {
    if (!ref) return { count: undefined, listUrl: null };
    try {
        const url = `http://www.echecs.asso.fr/FicheTournoi.aspx?Ref=${ref}`;
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html);

        // Find "Inscrits : XX"
        const text = $('body').text();
        const match = text.match(/Inscrits\s*:\s*(\d+)/i);
        const count = match ? parseInt(match[1]) : undefined;

        // Find the link to player list
        let listUrl = null;
        const listLink = $('a[href*="ListeInscrits.aspx"], a[href*="Resultats.aspx?"]').first();
        if (listLink.length > 0) {
            const href = listLink.attr('href') || '';
            listUrl = href.startsWith('http') ? href : 'http://www.echecs.asso.fr/' + href;
        }

        return { count, listUrl };
    } catch (e) {
        console.error(`Failed to fetch player count for ref ${ref}`);
    }
    return { count: undefined, listUrl: null };
}

async function fetchEloStats(fullUrl: string): Promise<{ avgElo?: number, topPlayerElo?: number } | undefined> {
    try {
        const res = await fetch(fullUrl);
        const html = await res.text();
        const $ = cheerio.load(html);

        const elos: number[] = [];
        const rows = $('table tr');

        // Find the header row (usually class papi_liste_t)
        let eloColIndex = -1;
        const headerRow = $('tr.papi_liste_t').first();
        if (headerRow.length > 0) {
            headerRow.find('td, th').each((i, cell) => {
                const txt = $(cell).text().trim().toLowerCase();
                if (txt === 'elo' || txt === 'elor' || txt === 'elop' || txt === 'classement') {
                    eloColIndex = i;
                }
            });
        }

        // Fallback to index 3 if not found by header (common for FFE results)
        if (eloColIndex === -1) eloColIndex = 3;

        rows.each((i, row) => {
            // Only process player rows (papi_liste_f, papi_liste_p) or skip header
            if ($(row).hasClass('papi_liste_t')) return;
            const cells = $(row).find('td');
            if (cells.length < eloColIndex + 1) return;

            const eloText = cells.eq(eloColIndex).text().trim();
            // Elo text can be "1649 F" or "1399 E"
            const num = parseInt(eloText.split(' ')[0]);

            if (!isNaN(num) && num > 799 && num < 3000) {
                elos.push(num);
            }
        });

        if (elos.length > 2) { // Ensure we have enough data to be meaningful
            const sum = elos.reduce((a, b) => a + b, 0);
            return {
                avgElo: Math.round(sum / elos.length),
                topPlayerElo: Math.max(...elos)
            };
        }
    } catch (e) {
        console.error(`Failed to fetch Elo stats from ${fullUrl}`);
    }
    return undefined;
}

function extractHiddenFields($: cheerio.CheerioAPI) {
    return {
        '__VIEWSTATE': $('#__VIEWSTATE').val() || '',
        '__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val() || '',
        '__EVENTVALIDATION': $('#__EVENTVALIDATION').val() || '',
    };
}

function parseTournamentsOnPage($: cheerio.CheerioAPI): any[] {
    const items: any[] = [];
    const rows = $('tr').filter((_, el) => $(el).find('a[href*="FicheTournoi.aspx"]').length > 0);

    rows.each((_, row) => {
        const cells = $(row).find('td');
        const city = cells.eq(1).text().trim().split(' (')[0];
        const nameEl = cells.eq(3).find('a');
        const name = nameEl.text().trim();
        const link = 'http://www.echecs.asso.fr/' + nameEl.attr('href');
        const ref = new URL(link, 'http://www.echecs.asso.fr').searchParams.get('Ref');
        const dateStr = cells.eq(4).text().trim();
        const handicapX = cells.eq(6).text().trim().toUpperCase() === 'X';

        if (name && city) {
            items.push({ id: ref, name, city, dateStr, link, handicapX });
        }
    });

    return items;
}

export async function fetchLiveTournaments(): Promise<Tournament[]> {
    const categories = [
        { level: 1, format: 'Lent' as const, name: 'Cadence Lente' },
        { level: 2, format: 'Lent' as const, name: '60 ko / 61mn' },
        { level: 3, format: 'Rapide' as const, name: 'Rapide' },
        { level: 4, format: 'Blitz' as const, name: 'Blitz' }
    ];
    let allRawTournaments: any[] = [];

    for (const cat of categories) {
        console.log(`Scraping level ${cat.level} (${cat.name})...`);
        try {
            // Page 1
            const url = `${BASE_URL}?Action=ANNONCE&Level=${cat.level}`;
            const firstPageRes = await fetch(url);
            const firstPageHtml = await firstPageRes.text();
            let $ = cheerio.load(firstPageHtml);

            let pageData = parseTournamentsOnPage($);
            // Add forced format from category
            pageData = pageData.map(d => ({ ...d, forcedFormat: cat.format }));

            allRawTournaments = [...allRawTournaments, ...pageData];

            // Handle pagination
            let hiddenFields = extractHiddenFields($);

            for (let p = 2; p <= 10; p++) {
                const formData = new URLSearchParams();
                formData.append('__EVENTTARGET', 'ctl00$ContentPlaceHolderMain$PagerHeader');
                formData.append('__EVENTARGUMENT', p.toString());
                formData.append('__VIEWSTATE', hiddenFields.__VIEWSTATE as string);
                formData.append('__VIEWSTATEGENERATOR', hiddenFields.__VIEWSTATEGENERATOR as string);
                formData.append('__EVENTVALIDATION', hiddenFields.__EVENTVALIDATION as string);

                const postRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });

                const postHtml = await postRes.text();
                $ = cheerio.load(postHtml);

                const nextPageData = parseTournamentsOnPage($).map(d => ({ ...d, forcedFormat: cat.format }));
                if (nextPageData.length === 0) break;

                allRawTournaments = [...allRawTournaments, ...nextPageData];
                hiddenFields = extractHiddenFields($);
                console.log(`Level ${cat.level}, Page ${p}: Added ${nextPageData.length} tournaments.`);
            }
        } catch (e) {
            console.error(`Error scraping level ${cat.level}:`, e);
        }
    }

    // Convert raw to Tournament objects (with geocoding)
    const rawTournamentObjects: Tournament[] = [];
    const processedKeys = new Set();

    for (const item of allRawTournaments) {
        const key = `${item.id || item.link}`;
        if (processedKeys.has(key)) continue;
        processedKeys.add(key);

        const coords = await getCoordinates(item.city);

        // Fetch player count & Elo stats (with a small delay for server friendliness)
        let registeredCountNum = undefined;
        let eloStats = undefined;
        if (item.id) {
            await new Promise(r => setTimeout(r, 100)); // Small sleep
            const extra = await fetchRegisteredCount(item.id);
            registeredCountNum = extra.count;

            // If the ficha tournoi says there's a list, fetch it
            if (extra.listUrl) {
                eloStats = await fetchEloStats(extra.listUrl);
            }
        }

        rawTournamentObjects.push(createTournamentObject(
            item.id || `gen-${Math.random()}`,
            item.name,
            item.city,
            item.dateStr,
            item.link,
            coords,
            item.forcedFormat,
            item.handicapX,
            registeredCountNum,
            eloStats?.avgElo,
            eloStats?.topPlayerElo
        ));
    }

    // Grouping Logic: same location, same date, similar names
    const groupedTournaments: Tournament[] = [];
    const groups = new Map<string, Tournament[]>();

    for (const t of rawTournamentObjects) {
        const groupKey = `${t.location.lat.toFixed(4)}|${t.location.lng.toFixed(4)}|${t.date}`;
        if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
        }
        groups.get(groupKey)?.push(t);
    }

    for (const [key, group] of groups) {
        if (group.length === 1) {
            groupedTournaments.push(group[0]);
            continue;
        }

        const subgroupByPrefix = new Map<string, Tournament[]>();
        for (const t of group) {
            const prefix = t.name.replace(/\s+[ABCDE]$|\s+Open\s+[ABCDE]$/i, '').trim();
            if (!subgroupByPrefix.has(prefix)) subgroupByPrefix.set(prefix, []);
            subgroupByPrefix.get(prefix)?.push(t);
        }

        for (const [prefix, subGroup] of subgroupByPrefix) {
            if (subGroup.length === 1) {
                groupedTournaments.push(subGroup[0]);
            } else {
                const first = subGroup[0];
                groupedTournaments.push({
                    ...first,
                    id: `grouped-${first.id}`,
                    name: prefix,
                    sections: subGroup.map(s => ({
                        name: s.name,
                        eloBracket: s.eloBracket,
                        format: s.format,
                        homologationLink: s.homologationLink
                    }))
                });
            }
        }
    }

    console.log(`Total tournaments after grouping: ${groupedTournaments.length} (from ${rawTournamentObjects.length} raw)`);
    return groupedTournaments;
}

function createTournamentObject(
    id: string,
    name: string,
    city: string,
    dateStr: string,
    link: string,
    coords: CityCoordinates,
    forcedFormat?: 'Blitz' | 'Rapide' | 'Lent',
    handicapX?: boolean,
    registeredCount?: number,
    avgElo?: number,
    topPlayerElo?: number
): Tournament {
    let format: 'Blitz' | 'Rapide' | 'Lent' = forcedFormat || 'Lent';

    const lowerName = name.toLowerCase();
    if (!forcedFormat) {
        if (lowerName.includes('blitz')) format = 'Blitz';
        else if (lowerName.includes('rapide')) format = 'Rapide';
    }

    let eloBracket = 'Toutes catégories';

    // Improved Regex-based Elo detection
    const minusMatch = lowerName.match(/[-<]\s*(\d{4})/); // matches -1600, < 1600, - 1600
    const plusMatch = lowerName.match(/([+>]|plus de)\s*(\d{4})/); // matches +1700, > 1700, plus de 1700
    const rangeMatch = lowerName.match(/(\d{4})\s*-\s*(\d{4})/); // matches 1500-1799, 1600 - 2000

    if (rangeMatch) {
        const low = parseInt(rangeMatch[1]);
        const high = parseInt(rangeMatch[2]);
        if (high <= 1650) eloBracket = '-1600';
        else if (low >= 1500 && high <= 2300) eloBracket = '1600-2000';
        else if (low >= 2000) eloBracket = '2000+';
    } else if (minusMatch) {
        const val = parseInt(minusMatch[1]);
        if (val <= 1650) eloBracket = '-1600';
        else if (val <= 2300) eloBracket = '1600-2000';
    } else if (plusMatch) {
        const val = parseInt(plusMatch[2]);
        if (val >= 2000) eloBracket = '2000+';
        else if (val >= 1400) eloBracket = '1600-2000';
    } else if (lowerName.includes('en dessous de 1600') || lowerName.includes('moins de 1600')) {
        eloBracket = '-1600';
    }

    // Improved Internal Tournament detection
    const isInternalName = lowerName.includes('interne') ||
        lowerName.includes('réservé aux membres') ||
        lowerName.includes('tournoi du club') ||
        lowerName.includes('membres du club') ||
        lowerName.includes('membres de r2c2') || // Specific club examples observed
        lowerName.includes('championnat du club') ||
        lowerName.includes('réservé membres') ||
        lowerName.includes('uniquement membres');

    return {
        id: id,
        name: name,
        format: format,
        eloBracket: eloBracket,
        location: {
            lat: coords.lat,
            lng: coords.lng,
            city: city,
            address: city
        },
        hasPlayersList: link.includes('ListeInscrits.aspx'),
        registeredCount: registeredCount,
        avgElo: avgElo,
        topPlayerElo: topPlayerElo,
        homologationLink: link,
        date: parseFFEDate(dateStr),
        isInternal: isInternalName
    };
}

function parseFFEDate(dateStr: string): string {
    const months: Record<string, string> = {
        'janv.': '01', 'févr.': '02', 'mars': '03', 'avr.': '04',
        'mai': '05', 'juin': '06', 'juil.': '07', 'août': '08',
        'sept.': '09', 'oct.': '10', 'nov.': '11', 'déc.': '12'
    };

    // Check if it's already a full date like "23 oct. 2026"
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
        const day = parts[0].padStart(2, '0');
        const monthName = parts[1].toLowerCase();
        const month = months[monthName] || '01';
        const year = parts[2] || '2026'; // Default to current year if missing
        return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
}
