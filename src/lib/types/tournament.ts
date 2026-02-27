export interface Tournament {
    id: string;
    name: string;
    format: 'Blitz' | 'Rapide' | 'Lent';
    eloBracket: string;
    location: {
        lat: number;
        lng: number;
        city: string;
        address: string;
    };
    hasPlayersList: boolean;
    registeredCount?: number;
    avgElo?: number;
    topPlayerElo?: number;
    homologationLink: string;
    date: string;
    distance?: number;
    carDistance?: string;
    duration?: string;
    isInternal?: boolean;
    sections?: {
        name: string;
        eloBracket: string;
        format: 'Blitz' | 'Rapide' | 'Lent';
        homologationLink: string;
    }[];
}
