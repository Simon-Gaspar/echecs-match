import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { MapPin, Calendar, Activity, Trophy, ArrowLeft, ExternalLink, Users } from "lucide-react";
import { Tournament } from "@/lib/types/tournament";
import { Header } from "@/components/features/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// Define the shape of params
interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TournamentDetailsPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const dataPath = path.join(process.cwd(), 'src/data/tournaments.json');
    let tournaments: Tournament[] = [];
    let lastUpdate: string | null = null;

    try {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(fileContent);
        tournaments = data.tournaments;
        lastUpdate = data.lastUpdate;
    } catch (e) {
        console.error("Failed to load tournaments data", e);
    }

    const t = tournaments.find(t => t.id === id);

    if (!t) {
        notFound();
    }

    // Format date nicely
    const dateObj = new Date(t.date);
    const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(dateObj);

    // Fetch shortlist count ("Who's going")
    let interestedCount = 0;
    try {
        const { count, error } = await supabase
            .from('shortlists')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', id);

        if (!error && count !== null) {
            interestedCount = count;
        }
    } catch (e) {
        console.error("Failed to fetch interested count", e);
    }

    return (
        <>
            <Header lastUpdate={lastUpdate} />
            <main className="flex-1 bg-muted/10 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Return Button */}
                    <Link href="/">
                        <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la carte
                        </Button>
                    </Link>

                    {/* Main Card */}
                    <div className="bg-card border-2 shadow-2xl rounded-3xl p-6 sm:p-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="space-y-4 flex-1">
                                {t.isInternal && (
                                    <div className="inline-block bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                                        Tournoi Interne
                                    </div>
                                )}
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight">
                                    {t.name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        {t.location.city}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        {dateFormatted}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                                <a href={t.homologationLink} target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20">
                                        <ExternalLink className="w-5 h-5 mr-3" /> Fiche Officielle
                                    </Button>
                                </a>
                                {t.hasPlayersList && t.registeredCount !== undefined && (
                                    <div className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        {t.registeredCount} inscrit{t.registeredCount > 1 ? 's' : ''} FFE
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social Stats - Who's Going */}
                        {interestedCount > 0 && (
                            <div className="mt-8 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                                    <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">
                                        {interestedCount} joueur{interestedCount > 1 ? 's' : ''} de la plateforme {interestedCount > 1 ? 'sont intéressés' : 'est intéressé'}
                                    </p>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">Ils ont ajouté ce tournoi à leurs favoris.</p>
                                </div>
                            </div>
                        )}

                        {/* Badges Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 p-6 bg-muted/30 rounded-2xl">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Format</p>
                                <p className="font-bold flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-primary shrink-0" />
                                    <span className="truncate">{t.format}</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Elo Autorisé</p>
                                <p className="font-bold flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-primary shrink-0" />
                                    <span className="truncate">{t.eloBracket}</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Elo Moyen</p>
                                <p className="font-bold">{t.avgElo ? `${t.avgElo} Elo` : 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Plus haut Elo</p>
                                <p className="font-bold">{t.topPlayerElo ? `${t.topPlayerElo} Elo` : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Future Sections: e.g. Weather, Map Preview, Comments, etc. */}
                    <div className="bg-card border-x-2 border-b-2 shadow-xl rounded-b-3xl p-6 opacity-60">
                        <p className="text-center text-sm font-bold text-muted-foreground">Plus de détails prochainement (Météo, itinéraire...)</p>
                    </div>

                </div>
            </main>
        </>
    );
}
