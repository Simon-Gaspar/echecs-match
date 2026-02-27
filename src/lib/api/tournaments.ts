import { Tournament } from '@/lib/types/tournament';
import { parseLocalPapiFile } from './papiParser';
import { fetchLiveTournaments, isInternalTournament } from './ffeScraper';
import { fetchSwissTournaments } from './swissScraper';
import path from 'path';
import fs from 'fs';

const mockTournaments: Tournament[] = [
    {
        id: "hom-001",
        name: "31e Open de Capeline",
        format: "Lent",
        eloBracket: "1600-2000",
        location: {
            lat: 48.8566,
            lng: 2.3522,
            city: "Paris",
            address: "Mairie du 4e, Place Baudoyer"
        },
        hasPlayersList: true,
        homologationLink: "https://ffechecs.fr",
        date: "2026-03-15"
    },
    {
        id: "hom-002",
        name: "Tournoi Rapide de Lyon",
        format: "Rapide",
        eloBracket: "Toutes catégories",
        location: {
            lat: 45.7640,
            lng: 4.8357,
            city: "Lyon",
            address: "Complexe Sportif Tronchet"
        },
        hasPlayersList: false,
        homologationLink: "https://ffechecs.fr",
        date: "2026-03-20"
    },
    {
        id: "hom-003",
        name: "Blitz du Dimanche",
        format: "Blitz",
        eloBracket: "-1600",
        location: {
            lat: 43.2965,
            lng: 5.3698,
            city: "Marseille",
            address: "Club d'Échecs Phocéen"
        },
        hasPlayersList: true,
        homologationLink: "https://ffechecs.fr",
        date: "2026-04-05"
    },
    {
        id: "hom-004",
        name: "Open d'Été de Bordeaux",
        format: "Lent",
        eloBracket: "-1600",
        location: {
            lat: 44.8378,
            lng: -0.5792,
            city: "Bordeaux",
            address: "Palais des Sports Gironde"
        },
        hasPlayersList: true,
        homologationLink: "https://ffechecs.fr",
        date: "2026-07-10"
    },
    {
        id: "hom-005",
        name: "Semi-rapide de l'Est",
        format: "Rapide",
        eloBracket: "1600-2000",
        location: {
            lat: 48.5734,
            lng: 7.7521,
            city: "Strasbourg",
            address: "Maison des Associations"
        },
        hasPlayersList: false,
        homologationLink: "https://ffechecs.fr",
        date: "2026-05-12"
    }
];

export async function getTournaments(): Promise<Tournament[]> {
    try {
        let ffeData: Tournament[] = [];

        // 1. Load FFE data (from cache or live)
        const jsonPath = path.join(process.cwd(), 'src/data/tournaments.json');
        if (fs.existsSync(jsonPath)) {
            const jsonData = fs.readFileSync(jsonPath, 'utf8');
            ffeData = JSON.parse(jsonData).tournaments || [];
        } else {
            ffeData = await fetchLiveTournaments();
        }

        // 2. Fetch Swiss data (always live for now as it's fast)
        const swissData = await fetchSwissTournaments();

        const combined = [...ffeData, ...swissData].map(t => ({
            ...t,
            isInternal: t.isInternal || isInternalTournament(t.name)
        }));
        if (combined.length > 0) {
            return combined;
        }

        // 3. Fallback to local PAPI file if it exists
        const papiPath = path.join(process.cwd(), 'src', 'data', 'tournaments.papi');
        if (fs.existsSync(papiPath)) {
            const parsedData = parseLocalPapiFile(papiPath);
            if (parsedData.length > 0) {
                return parsedData;
            }
        }
    } catch (err) {
        console.error("Error fetching tournaments, falling back to mocks", err);
    }

    // 4. Last fallback to mocks
    return mockTournaments;
}
