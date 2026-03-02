import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import Link from "next/link";
import {
    MapPin, Calendar, Activity, Trophy, ArrowLeft, ExternalLink,
    Users, ShieldCheck, Clock, Car, Navigation, Swords, Lightbulb
} from "lucide-react";
import { Tournament } from "@/lib/types/tournament";
import { Header } from "@/components/features/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { TournamentMiniMap } from "@/components/features/TournamentMiniMap";
import { TournamentActions } from "@/components/features/TournamentActions";
import { CountdownBadge } from "@/components/features/CountdownBadge";
import { AnimatedStat } from "@/components/features/AnimatedStat";
import type { Metadata } from "next";

interface PageProps {
    params: Promise<{ id: string }>;
}

function loadTournament(id: string): Tournament | null {
    const dataPath = path.join(process.cwd(), 'src/data/tournaments.json');
    try {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(fileContent);
        return data.tournaments.find((t: Tournament) => t.id === id) || null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const t = loadTournament(id);

    if (!t) {
        return { title: "Tournoi introuvable" };
    }

    const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(t.date));

    const title = `${t.name} — ${t.location.city}`;
    const description = `Tournoi ${t.format} le ${dateFormatted} à ${t.location.city}. ${t.eloBracket !== 'Toutes catégories' ? `Elo : ${t.eloBracket}.` : ''} Consultez les détails et inscrivez-vous.`;

    return {
        title,
        description,
        openGraph: {
            title: `♟️ ${title}`,
            description,
            type: "article",
        },
        twitter: {
            card: "summary",
            title: `♟️ ${title}`,
            description,
        },
    };
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

    const dayOfWeek = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long'
    }).format(dateObj);

    let interestedCount = 0;
    let viewCount = 0;
    try {
        const { count, error } = await supabase
            .from('shortlists')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', id);

        if (!error && count !== null) {
            interestedCount = count;
        }

        // Track this view (fire-and-forget)
        supabase.from('tournament_views').insert({ tournament_id: id }).then(() => { });

        // Get total view count
        const { count: views } = await supabase
            .from('tournament_views')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', id);

        if (views !== null) viewCount = views;
    } catch (e) {
        console.error("Failed to fetch counts", e);
    }

    // Format badge
    const formatColors: Record<string, string> = {
        'Blitz': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'Rapide': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Lent': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    const formatColor = formatColors[t.format] || 'bg-white/5 text-white/60 border-white/10';

    return (
        <div className="flex flex-col min-h-screen bg-[#0b0c0e] text-foreground">
            <Header lastUpdate={lastUpdate} />
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Top navigation */}
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" className="text-muted-foreground hover:text-white transition-colors group">
                                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Carte
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Homologué FFE / FIDE</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* =================== Main content =================== */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Hero Card */}
                            <div className="bg-secondary/20 border border-white/5 backdrop-blur-xl shadow-2xl rounded-3xl p-6 sm:p-10 relative overflow-hidden">
                                {/* Accent bar */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary to-blue-500" />

                                <div className="space-y-6">
                                    {/* Internal badge + countdown */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {t.isInternal && (
                                            <div className="inline-block bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/20">
                                                Tournoi Interne
                                            </div>
                                        )}
                                        <CountdownBadge date={t.date} />
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-4">
                                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                                            {t.name}
                                        </h1>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white">{t.location.city}</span>
                                                    {t.location.address && t.location.address.toLowerCase() !== t.location.city.toLowerCase() && (
                                                        <span className="text-[11px] opacity-50">{t.location.address}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white capitalize">{dayOfWeek} {dateFormatted}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <TournamentActions tournament={t} />

                                    <div className="h-px bg-white/5" />

                                    {/* Format & Elo grid — now with colored chips */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-2">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Format</p>
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold ${formatColor}`}>
                                                <Activity className="w-4 h-4 shrink-0" />
                                                {t.format}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Elo Autorisé</p>
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white">
                                                <Trophy className="w-4 h-4 text-primary shrink-0" />
                                                {t.eloBracket}
                                            </div>
                                        </div>
                                        {(t.carDistance || t.duration) && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Trajet</p>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white">
                                                    <Car className="w-4 h-4 text-blue-400 shrink-0" />
                                                    {t.carDistance || t.duration}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Multi-open sections */}
                                    {t.sections && t.sections.length > 0 && (
                                        <>
                                            <div className="h-px bg-white/5" />
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Swords className="w-4 h-4 text-primary" />
                                                    <h2 className="text-sm font-black uppercase tracking-tight">
                                                        {t.sections.length} Section{t.sections.length > 1 ? 's' : ''}
                                                    </h2>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {t.sections.map((section, idx) => {
                                                        const sectionFormatColor = formatColors[section.format] || 'bg-white/5 text-white/60 border-white/10';
                                                        return (
                                                            <a
                                                                key={idx}
                                                                href={section.homologationLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group flex items-center justify-between bg-background/30 hover:bg-background/50 border border-white/5 hover:border-primary/20 rounded-2xl px-4 py-3 transition-all"
                                                            >
                                                                <div className="flex flex-col gap-1.5">
                                                                    <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                                                                        {section.name}
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${sectionFormatColor}`}>
                                                                            {section.format}
                                                                        </span>
                                                                        <span className="text-[10px] font-medium text-muted-foreground">
                                                                            {section.eloBracket}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-40 group-hover:opacity-80 group-hover:text-primary transition-all" />
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats card */}
                            <div className="bg-secondary/10 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black uppercase tracking-tighter italic">Statistiques du tournoi</h2>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                        <Clock className="w-3.5 h-3.5" /> Mis à jour {new Intl.RelativeTimeFormat('fr-FR').format(-1, 'day')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-background/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">Elo Moyen</span>
                                        {t.avgElo ? (
                                            <AnimatedStat value={t.avgElo} className="text-3xl font-black italic text-white tabular-nums" />
                                        ) : (
                                            <span className="text-3xl font-black italic text-white/20">---</span>
                                        )}
                                    </div>
                                    <div className="bg-background/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">Top Elo</span>
                                        {t.topPlayerElo ? (
                                            <AnimatedStat value={t.topPlayerElo} className="text-3xl font-black italic text-white tabular-nums" />
                                        ) : (
                                            <span className="text-3xl font-black italic text-white/20">---</span>
                                        )}
                                    </div>
                                    <div className="bg-background/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">Inscrits FFE</span>
                                        <div className="flex items-center gap-2">
                                            <AnimatedStat value={t.registeredCount || 0} className="text-3xl font-black italic text-emerald-400 tabular-nums" />
                                            <Users className="w-5 h-5 text-emerald-500/40" />
                                        </div>
                                    </div>
                                </div>

                                {/* Community engagement */}
                                {(interestedCount > 0 || viewCount > 0) && (
                                    <div className="flex gap-3">
                                        {viewCount > 0 && (
                                            <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-3 group hover:border-blue-500/30 transition-colors">
                                                <div className="p-2 bg-blue-500/20 rounded-xl">
                                                    <Activity className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-blue-200">{viewCount}</p>
                                                    <p className="text-[9px] font-bold text-blue-500/60 uppercase tracking-wider">Vues</p>
                                                </div>
                                            </div>
                                        )}
                                        {interestedCount > 0 && (
                                            <div className="flex-1 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 group hover:border-amber-500/30 transition-colors">
                                                <div className="p-2 bg-amber-500/20 rounded-xl">
                                                    <Users className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-amber-200">{interestedCount}</p>
                                                    <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-wider">Intéressé{interestedCount > 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* =================== Sidebar =================== */}
                        <div className="space-y-6">
                            {/* CTA Button */}
                            <a href={t.homologationLink} target="_blank" rel="noopener noreferrer">
                                <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative flex items-center gap-3">
                                        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Fiche Officielle
                                    </span>
                                </Button>
                            </a>

                            {/* Mini Map */}
                            <TournamentMiniMap
                                lat={t.location.lat}
                                lng={t.location.lng}
                                cityName={t.location.city}
                            />

                            {/* Directions shortcut */}
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${t.location.lat},${t.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl border border-white/5 bg-secondary/10 hover:bg-secondary/20 transition-all text-sm font-bold text-muted-foreground hover:text-white group"
                            >
                                <Navigation className="w-4 h-4 text-blue-400 group-hover:animate-pulse" />
                                Itinéraire Google Maps
                            </a>

                            {/* Tips card */}
                            <div className="bg-secondary/10 border border-white/10 p-6 rounded-3xl space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/40 via-amber-500/20 to-transparent" />
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                        <Lightbulb className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Conseil Match</h3>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs font-medium leading-relaxed opacity-70">
                                        N&apos;oubliez pas d&apos;imprimer votre licence FFE ou de l&apos;avoir sur votre smartphone.
                                    </p>
                                    <p className="text-xs font-medium leading-relaxed opacity-70">
                                        Pointez au moins 30 minutes avant le début de la première ronde.
                                    </p>
                                    <p className="text-xs font-medium leading-relaxed opacity-70">
                                        Pensez à vérifier l&apos;adresse exacte sur la fiche officielle.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
