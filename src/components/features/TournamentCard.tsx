import { useMemo } from "react";
import { Tournament } from "@/lib/types/tournament";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, Trophy, Accessibility, Bookmark, Users, Car, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface TournamentCardProps {
    tournament: Tournament;
    isHovered?: boolean;
    onHover?: (id: string | null) => void;
    isShortlisted?: boolean;
    onToggleShortlist?: (id: string) => void;
    distance?: number;
}

export function TournamentCard({ tournament, isHovered, onHover, isShortlisted, onToggleShortlist, distance }: TournamentCardProps) {
    const { user } = useAuth();
    const formattedDate = new Date(tournament.date).toLocaleDateString("fr-FR", { month: 'short', day: 'numeric' });

    // Elo compatibility check
    const isCompatible = useMemo(() => {
        if (!user || !user.elo) return null;
        const bracket = tournament.eloBracket;
        if (bracket === 'Toutes catégories' || bracket === 'Tous') return true;

        const elo = user.elo;
        if (bracket === '-1600') return elo < 1600;
        if (bracket === '1600-2000' || bracket === '1600-2200') return elo >= 1600 && elo <= 2300;
        if (bracket === '2000+' || bracket === '2100+' || bracket === '2200+') return elo >= 2000;

        return true;
    }, [user, tournament.eloBracket]);

    // Check if address is basically the same as city to avoid "SAINT DIZIER • SAINT DIZIER"
    const cleanCity = tournament.location.city.trim().toLowerCase();
    const cleanAddress = tournament.location.address.trim().toLowerCase();
    const isDifferentAddress = cleanAddress && cleanAddress !== cleanCity && !cleanAddress.startsWith(cleanCity);
    const distanceText = distance !== undefined ? `${Math.round(distance)} km` : null;

    return (
        <Card
            className={`transition-all duration-200 cursor-pointer ${isHovered ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : 'hover:shadow-md'}`}
            onMouseEnter={() => onHover?.(tournament.id)}
            onMouseLeave={() => onHover?.(null)}
        >
            <CardHeader className="p-4 pb-2 relative">
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleShortlist?.(tournament.id); }}
                        className={`p-1.5 rounded-full shadow-sm border hover:bg-background transition-colors active:scale-95 flex items-center justify-center ${isShortlisted
                            ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-500 hover:text-amber-700'
                            : 'bg-background/80 border-border/50 text-muted-foreground'
                            }`}
                        title={isShortlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                        <Bookmark className={`h-4 w-4 ${isShortlisted ? 'fill-current' : ''}`} />
                    </button>
                    <Badge variant="default" className="bg-primary hover:bg-primary font-bold px-2 py-1 shadow-sm mt-0.5 pointer-events-none">
                        {formattedDate}
                    </Badge>
                    {isCompatible !== null && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${isCompatible
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                            {isCompatible ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                            {isCompatible ? 'Compatible' : 'Incompatible'}
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-start gap-2 pr-12">
                    <h3 className="font-bold text-base leading-tight">{tournament.name}</h3>
                </div>
                {!tournament.sections ? (
                    <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tournament.format}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tournament.eloBracket}</Badge>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5 mt-2">
                        {tournament.sections.map((section, idx) => (
                            <a key={idx} href={section.homologationLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-muted/50 hover:bg-muted rounded-md px-2 py-1.5 border border-border/50 transition-colors">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase opacity-80 tracking-tighter w-[15px]">{section.name.split(' ').pop()}</span>
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 leading-none">{section.format}</Badge>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 leading-none bg-background">{section.eloBracket}</Badge>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 opacity-50 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 py-2 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="line-clamp-2">
                            {tournament.location.city}
                            {isDifferentAddress && (
                                <span className="opacity-50 text-xs ml-1">• {tournament.location.address}</span>
                            )}
                        </span>
                        {distanceText && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 font-bold bg-muted/30 border-none shrink-0">
                                {distanceText}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {tournament.registeredCount !== undefined && (
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Users className="h-4 w-4" />
                            <span>{tournament.registeredCount} joueur{tournament.registeredCount !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                    {tournament.avgElo && (
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold" title="Elo moyen des participants">
                            <Trophy className="h-4 w-4" />
                            <span>~{tournament.avgElo} Elo</span>
                        </div>
                    )}
                    {tournament.topPlayerElo && (
                        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50" title="Meilleur Elo inscrit">
                            Top: {tournament.topPlayerElo}
                        </div>
                    )}
                    {tournament.carDistance && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                            <Car className="h-4 w-4" />
                            <span>{tournament.carDistance}</span>
                        </div>
                    )}
                    {tournament.duration && (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold">
                            <Clock className="h-4 w-4" />
                            <span>{tournament.duration}</span>
                        </div>
                    )}
                </div>
            </CardContent>
            {!tournament.sections && (
                <CardFooter className="p-4 pt-0">
                    <a
                        href={tournament.homologationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 rounded-xl text-xs font-bold transition-all border border-border/50 shadow-sm"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Fiche Tournoi
                    </a>
                </CardFooter>
            )}
        </Card>
    );
}
