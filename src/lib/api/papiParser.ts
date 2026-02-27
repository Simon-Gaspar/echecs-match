import MDBReader from 'mdb-reader';
import { Tournament } from '@/lib/types/tournament';
import fs from 'fs';

/**
 * Parses a PAPI file (Microsoft Access JET 3.6 database) buffer into a structured JSON array.
 * Note: Table and column names depend on the exact PAPI structure.
 */
export function parsePapiBuffer(buffer: Buffer): Tournament[] {
    const reader = new MDBReader(buffer);

    // En général, la table contenant les infos sur l'événement s'appelle "Tournoi" ou "Info"
    // et il y a une table "Joueurs" etc.
    // Voici une logique de fallback, à adapter selon la structure exacte
    const tableNames = reader.getTableNames();

    let tournaments: Tournament[] = [];

    // TODO: Adapter ces noms de colonnes et de tables selon le vrai schéma PAPI
    if (tableNames.includes('Tournoi')) {
        const tournoiTable = reader.getTable('Tournoi');
        const rows = tournoiTable.getData();

        tournaments = rows.map((row: any, index: number) => {
            // Mapping fictif à ajuster avec le vrai schéma d'un fichier PAPI FFE
            return {
                id: `papi-${row.Id || index}`,
                name: row.Nom || 'Tournoi Sans Nom',
                format: row.Cadence === 'B' ? 'Blitz' : (row.Cadence === 'R' ? 'Rapide' : 'Lent'),
                eloBracket: row.EloMax ? `-${row.EloMax}` : 'Toutes catégories',
                location: {
                    lat: 46.2276, // Valeur par défaut si coordonnée absente
                    lng: 2.2137,
                    city: row.Lieu || 'Ville inconnue',
                    address: row.Adresse || 'Adresse inconnue'
                },
                hasPlayersList: false,
                homologationLink: `https://ffechecs.fr/tournoi?id=${row.Homologation || ''}`,
                date: row.DateDebut ? new Date(row.DateDebut).toISOString() : new Date().toISOString()
            };
        });
    }

    return tournaments;
}

/**
 * Pour test local : permet de lire un fichier .papi depuis le disque
 */
export function parseLocalPapiFile(filePath: string): Tournament[] {
    if (!fs.existsSync(filePath)) {
        console.error("Fichier introuvable:", filePath);
        return [];
    }
    const buffer = fs.readFileSync(filePath);
    return parsePapiBuffer(buffer);
}
