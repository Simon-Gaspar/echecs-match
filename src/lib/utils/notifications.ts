import { Tournament } from "@/lib/types/tournament";
import { FilterState } from "@/components/features/Filters";

export interface AlertConfig {
    id: string;
    format: string;
    radius: number;
    city: string;
    lat: number;
    lng: number;
}

export function checkAlerts(tournaments: Tournament[], currentAlerts: AlertConfig[]) {
    const seenIds = new Set(JSON.parse(localStorage.getItem('echecs-seen-ids') || '[]'));
    const newMatches: Tournament[] = [];

    // Only check tournaments that haven't been "seen" before
    const newTournaments = tournaments.filter(t => !seenIds.has(t.id));

    for (const alert of currentAlerts) {
        for (const t of newTournaments) {
            // Check format
            if (alert.format !== 'Tous' && t.format !== alert.format) continue;

            // Check distance
            const dist = calculateDistance(alert.lat, alert.lng, t.location.lat, t.location.lng);
            if (dist <= alert.radius) {
                newMatches.push(t);
            }
        }
    }

    // Update seen IDs
    const updatedSeen = Array.from(new Set([...Array.from(seenIds), ...tournaments.map(t => t.id)]));
    localStorage.setItem('echecs-seen-ids', JSON.stringify(updatedSeen.slice(-2000))); // Keep last 2000

    return newMatches;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
