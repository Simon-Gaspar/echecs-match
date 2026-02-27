import { NextResponse } from 'next/server';
import { getTournaments } from '@/lib/api/tournaments';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const jsonPath = path.join(process.cwd(), 'src/data/tournaments.json');
        let lastUpdate = null;

        if (fs.existsSync(jsonPath)) {
            const jsonData = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(jsonData);
            lastUpdate = parsed.lastUpdate;
        }

        const data = await getTournaments();
        return NextResponse.json({ tournaments: data, lastUpdate }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
    }
}
