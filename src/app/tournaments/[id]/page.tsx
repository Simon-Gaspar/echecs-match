import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { MapPin, Calendar, Activity, Trophy, ArrowLeft, ExternalLink, Users, ShieldCheck, Clock } from "lucide-react";
import { Tournament } from "@/lib/types/tournament";
import { Header } from "@/components/features/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { TournamentMiniMap } from "@/components/features/TournamentMiniMap";
import { TournamentActions } from "@/components/features/TournamentActions";

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

    const dateObj = new Date(t.date);
    const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(dateObj);

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
        <div className="flex flex-col min-h-screen bg-[#0b0c0e] text-foreground">
            <Header lastUpdate={lastUpdate} />
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Return Button */}
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" className="text-muted-foreground hover:text-white transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Carte
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Homologué FFE / FIDE</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-secondary/20 border border-white/5 backdrop-blur-xl shadow-2xl rounded-3xl p-6 sm:p-10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-primary" />

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        {t.isInternal && (
                                            <div className="inline-block bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/20">
                                                Tournoi Interne
                                            </div>
                                        )}
                                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                                            {t.name}
                                        </h1>

                                        <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {t.location.city}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-primary" />
                                                {dateFormatted}
                                            </div>
                                        </div>
                                    </div>

                                    <TournamentActions tournament={t} />

                                    <div className="h-px bg-white/5" />

                                    <div className="grid grid-cols-2 gap-6 pb-2">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Format</p>
                                            <p className="font-bold flex items-center gap-2 text-white italic">
                                                <Activity className="w-4 h-4 text-primary shrink-0" />
                                                {t.format}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Elo Autorisé</p>
                                            <p className="font-bold flex items-center gap-2 text-white">
                                                <Trophy className="w-4 h-4 text-primary shrink-0" />
                                                {t.eloBracket}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats & Players List if available */}
                            <div className="bg-secondary/10 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black uppercase tracking-tighter italic">Statistiques du tournoi</h2>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                        <Clock className="w-3.5 h-3.5" /> Mis à jour {new Intl.RelativeTimeFormat('fr-FR').format(-1, 'day')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-background/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-colors">
                                        <span className="text-xs font-bold text-muted-foreground uppercase opacity-60">Elo Moyen</span>
                                        <span className="text-xl font-black italic">{t.avgElo ? `${t.avgElo}` : '---'}</span>
                                    </div>
                                    <div className="bg-background/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-colors">
                                        <span className="text-xs font-bold text-muted-foreground uppercase opacity-60">Top Elo</span>
                                        <span className="text-xl font-black italic">{t.topPlayerElo ? `${t.topPlayerElo}` : '---'}</span>
                                    </div>
                                    <div className="bg-background/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between sm:col-span-2 group hover:border-emerald-500/20 transition-colors">
                                        <span className="text-xs font-bold text-muted-foreground uppercase opacity-60">Inscrits FFE</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-black italic text-emerald-400">{t.registeredCount || '0'}</span>
                                            <Users className="w-5 h-5 text-emerald-500/40" />
                                        </div>
                                    </div>
                                </div>

                                {interestedCount > 0 && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4">
                                        <div className="p-2 bg-amber-500/20 rounded-xl">
                                            <Users className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-tight text-amber-200">
                                                {interestedCount} joueur{interestedCount > 1 ? 's' : ''} de la communauté
                                            </p>
                                            <p className="text-[10px] font-bold text-amber-500/60 uppercase">Inscrit{interestedCount > 1 ? 's' : ''} à ce tournoi</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Call to Action */}
                            <a href={t.homologationLink} target="_blank" rel="noopener noreferrer">
                                <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 group">
                                    <ExternalLink className="w-5 h-5 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Fiche Officielle
                                </Button>
                            </a>

                            {/* Mini Map */}
                            <TournamentMiniMap
                                lat={t.location.lat}
                                lng={t.location.lng}
                                cityName={t.location.city}
                            />

                            <div className="bg-secondary/10 border border-white/10 p-6 rounded-3xl space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Conseil Match</h3>
                                <p className="text-xs font-medium leading-relaxed opacity-70">
                                    N'oubliez pas d'imprimer votre licence FFE ou de l'avoir sur votre smartphone. Pointez au moins 30 minutes avant le début de la première ronde.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

