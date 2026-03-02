import * as cheerio from 'cheerio';
import { Tournament } from '@/lib/types/tournament';

const BASE_URL = 'https://chess-calendar.eu/';

function parseDate(dateStr: string): string {
    const parts = dateStr.trim().split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return new Date().toISOString().split('T')[0];
}

function detectFormat(name: string): 'Blitz' | 'Rapide' | 'Lent' {
    const lower = name.toLowerCase();
    if (lower.includes('blitz') || lower.includes('bullet') || lower.includes('lightning') || lower.includes('5 min') || lower.includes("5'") || lower.includes('3+2')) return 'Blitz';
    if (lower.includes('rapid') || lower.includes('semi-rapid') || lower.includes('actif') || lower.includes('15 min') || lower.includes('15+') || lower.includes('20 min') || lower.includes('25 min') || lower.includes('30 min')) return 'Rapide';
    return 'Lent';
}

async function fetchMonthPage(month: string): Promise<string> {
    const url = `${BASE_URL}?country=LUX&month=${month}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EchecsMatchApp/1.0 (chess tournament aggregator)' } });
    return await res.text();
}

export async function fetchLuxembourgTournaments(): Promise<Tournament[]> {
    console.log("Scraping Luxembourg tournaments (chess-calendar.eu)...");
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
            console.log(`  Fetching Luxembourg month ${month}...`);
            const html = await fetchMonthPage(month);
            const $ = cheerio.load(html);

            $('div.calItem').each((_, el) => {
                const $el = $(el);
                const country = $el.find('div.country').text().trim().replace(/^,\s*/, '');
                if (country !== 'LUX') return;

                const dateText = $el.find('div.dateCol').text().trim();
                const dates = dateText.match(/\d{2}\.\d{2}\.\d{4}/g);
                if (!dates || dates.length === 0) return;
                const startDate = parseDate(dates[0]);

                const startDateObj = new Date(startDate);
                const twoWeeksAgo = new Date(now);
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                if (startDateObj < twoWeeksAgo) return;

                const name = $el.find('div.weblink').text().trim();
                if (!name || name.length < 3) return;

                const lower = name.toLowerCase();
                if (lower.includes('scolaire') || lower.includes('school')) return;
                if (lower.includes('équipe') || lower.includes('team')) return;

                const dedupeKey = `${name.toLowerCase()}-${startDate}`;
                if (seenNames.has(dedupeKey)) return;
                seenNames.add(dedupeKey);

                let city = $el.find('div.city').text().trim().replace(/^,\s*/, '').replace(/,\s*LUX\s*$/, '').trim();
                if (!city || city === ',') city = 'Luxembourg';

                let lat = 49.6117; // Default: Luxembourg City
                let lng = 6.1300;
                const mapsLink = $el.find('a[href*="maps.google.com"]').attr('href');
                if (mapsLink) {
                    const coordMatch = mapsLink.match(/q=([-\d.]+),[\s+]*([-\d.]+)/);
                    if (coordMatch) { lat = parseFloat(coordMatch[1]); lng = parseFloat(coordMatch[2]); }
                }

                const sourceLink = $el.find('div.source a').attr('href') || $el.find('a[href]:not([href*="maps.google"])').last().attr('href') || '';
                const format = detectFormat(name);
                const idPayload = `${name}-${city}-${startDate}`;
                const id = `lux-${Buffer.from(idPayload).toString('base64').replace(/[/+=]/g, '').slice(-16)}`;

                tournaments.push({
                    id, name, format,
                    eloBracket: 'Toutes catégories',
                    location: { lat, lng, city, address: city },
                    hasPlayersList: false,
                    homologationLink: sourceLink,
                    date: startDate
                });
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`  Total Luxembourg tournaments: ${tournaments.length}`);
        return tournaments;
    } catch (e) {
        console.error("Luxembourg scraping failed:", e);
        return [];
    }
}
