import * as cheerio from 'cheerio';
import { Tournament } from '@/lib/types/tournament';

const BASE_URL = 'https://chess-calendar.eu/';

function parseDate(dateStr: string): string {
    // Input: DD.MM.YYYY → Output: YYYY-MM-DD
    const parts = dateStr.trim().split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return new Date().toISOString().split('T')[0];
}

function detectFormat(name: string): 'Blitz' | 'Rapide' | 'Lent' {
    const lower = name.toLowerCase();

    if (
        lower.includes('blitz') ||
        lower.includes('relámpago') ||
        lower.includes('relampago') ||
        lower.includes('lightning') ||
        lower.includes('bullet') ||
        lower.includes('5 min') ||
        lower.includes("5'") ||
        lower.includes('3+2')
    ) {
        return 'Blitz';
    }

    if (
        lower.includes('rapid') ||
        lower.includes('rápid') ||
        lower.includes('activ') ||
        lower.includes('semirrápid') ||
        lower.includes('10 min') ||
        lower.includes('15 min') ||
        lower.includes('15+') ||
        lower.includes('20 min') ||
        lower.includes('25 min') ||
        lower.includes('30 min') ||
        lower.includes("15'") ||
        lower.includes("20'") ||
        lower.includes("25'")
    ) {
        return 'Rapide';
    }

    return 'Lent';
}

async function fetchMonthPage(month: string): Promise<string> {
    const url = `${BASE_URL}?country=ESP&month=${month}`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'EchecsMatchApp/1.0 (chess tournament aggregator)'
        }
    });
    return await res.text();
}

export async function fetchSpanishTournaments(): Promise<Tournament[]> {
    console.log("Scraping Spanish tournaments (chess-calendar.eu)...");

    try {
        const now = new Date();
        const months: string[] = [];
        for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        const tournaments: Tournament[] = [];
        const seenNames = new Set<string>();

        for (const month of months) {
            console.log(`  Fetching Spain month ${month}...`);
            const html = await fetchMonthPage(month);
            const $ = cheerio.load(html);

            $('div.calItem').each((_, el) => {
                const $el = $(el);

                // Check country
                const country = $el.find('div.country').text().trim().replace(/^,\s*/, '');
                if (country !== 'ESP') return;

                // Parse date(s)
                const dateText = $el.find('div.dateCol').text().trim();
                const dates = dateText.match(/\d{2}\.\d{2}\.\d{4}/g);
                if (!dates || dates.length === 0) return;
                const startDate = parseDate(dates[0]);

                // Filter: only keep future or very recent tournaments
                const startDateObj = new Date(startDate);
                const twoWeeksAgo = new Date(now);
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                if (startDateObj < twoWeeksAgo) return;

                // Parse name
                const name = $el.find('div.weblink').text().trim();
                if (!name || name.length < 3) return;

                // Skip school tournaments and team events
                const lower = name.toLowerCase();
                if (lower.includes('escolar') || lower.includes('school') || lower.includes('colegio')) return;
                if (lower.includes('equipo') || lower.includes('team')) return;

                // Deduplicate by name + date
                const dedupeKey = `${name.toLowerCase()}-${startDate}`;
                if (seenNames.has(dedupeKey)) return;
                seenNames.add(dedupeKey);

                // Parse city
                let city = $el.find('div.city').text().trim().replace(/^,\s*/, '').replace(/,\s*ESP\s*$/, '').trim();
                if (!city || city === ',') city = 'España';

                // Extract coordinates from maps link
                let lat = 40.4168; // Default: Madrid
                let lng = -3.7038;
                const mapsLink = $el.find('a[href*="maps.google.com"]').attr('href');
                if (mapsLink) {
                    const coordMatch = mapsLink.match(/q=([-\d.]+),[\s+]*([-\d.]+)/);
                    if (coordMatch) {
                        lat = parseFloat(coordMatch[1]);
                        lng = parseFloat(coordMatch[2]);
                    }
                }

                // Get external link
                const sourceLink = $el.find('div.source a').attr('href') ||
                    $el.find('a[href]:not([href*="maps.google"])').last().attr('href') || '';

                const format = detectFormat(name);

                // Generate a stable ID
                const idPayload = `${name}-${city}-${startDate}`;
                const id = `spain-${Buffer.from(idPayload).toString('base64').replace(/[/+=]/g, '').slice(-16)}`;

                tournaments.push({
                    id,
                    name,
                    format,
                    eloBracket: 'Toutes catégories',
                    location: {
                        lat,
                        lng,
                        city,
                        address: city
                    },
                    hasPlayersList: false,
                    homologationLink: sourceLink,
                    date: startDate
                });
            });

            // Be polite
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`  Total Spanish tournaments: ${tournaments.length}`);
        return tournaments;

    } catch (e) {
        console.error("Spanish scraping failed:", e);
        return [];
    }
}
