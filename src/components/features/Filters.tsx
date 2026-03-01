"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Calendar, MapPin, Search, Trophy, History, RotateCcw, LocateFixed, Loader2, ArrowUpDown, ShieldX, Star, Users, Layers, Filter } from "lucide-react";

export type FilterState = {
    format: string[];
    elo: string | null;
    hasPlayersList: boolean;
    multiOpen: boolean;
    excludeInternal: boolean;
    onlyShortlist: boolean;
    city: string;
    cityCoords?: { lat: number; lng: number } | null;
    radius: number;
    timeframe: number;
    sortBy: 'date' | 'distance';
};

interface FiltersProps {
    filters: FilterState;
    onChange: (newFilters: FilterState) => void;
    onReset: () => void;
}

const formatOptions = ["Tous", "Blitz", "Rapide", "Lent"];
const eloOptions = ["Tous", "Non classé", "-1600", "1600-2000", "2000+"];

export function Filters({ filters, onChange, onReset }: FiltersProps) {
    const [citySuggestions, setCitySuggestions] = React.useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [isLocating, setIsLocating] = React.useState(false);
    const [activePopover, setActivePopover] = React.useState<string | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setActivePopover(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
        const timeout = setTimeout(async () => {
            if (!filters.city || filters.city.length < 2) {
                setCitySuggestions([]);
                return;
            }
            if (!showSuggestions) return;

            try {
                const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(filters.city)}&fields=nom,codesPostaux,centre&boost=population&limit=5`);
                const data = await res.json();
                setCitySuggestions(data || []);
            } catch (e) {
                console.error("Erreur lors de l'autocomplétion:", e);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [filters.city, showSuggestions]);

    const selectCity = (cityData: any) => {
        let cityCoords = null;
        if (cityData.centre && cityData.centre.coordinates) {
            cityCoords = { lat: cityData.centre.coordinates[1], lng: cityData.centre.coordinates[0] };
        }
        onChange({ ...filters, city: cityData.nom, cityCoords });
        setShowSuggestions(false);
    };

    const handleFormatClick = (opt: string) => {
        if (opt === "Tous") {
            onChange({ ...filters, format: [] });
            return;
        }
        const isActive = filters.format.includes(opt);
        if (isActive) {
            onChange({ ...filters, format: filters.format.filter(f => f !== opt) });
        } else {
            onChange({ ...filters, format: [...filters.format, opt] });
        }
    };

    const handleEloClick = (option: string) => {
        onChange({ ...filters, elo: option === "Tous" ? null : option });
        setActivePopover(null);
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                const data = await res.json();
                const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || "Ma position";

                onChange({
                    ...filters,
                    city: cityName,
                    cityCoords: { lat: latitude, lng: longitude }
                });
            } catch (error) {
                console.error("Geolocation reverse lookup failed", error);
            } finally {
                setIsLocating(false);
            }
        }, () => {
            setIsLocating(false);
            console.warn("Geolocation denied or failed");
        });
    };

    return (
        <div className="flex items-center flex-wrap gap-2 bg-secondary/20 p-2 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl max-w-full">
            {/* Ville & Rayon */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/20 rounded-xl border border-white/5 min-w-[280px]">
                <div className="relative flex-1" ref={wrapperRef}>
                    <Search className="absolute left-0 top-0 bottom-0 my-auto h-4 w-4 text-primary animate-in fade-in zoom-in duration-500" />
                    <Input
                        placeholder="Ville..."
                        className="pl-6 h-7 bg-transparent border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-muted-foreground/50 w-full"
                        value={filters.city}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            onChange({ ...filters, city: e.target.value, cityCoords: null });
                            setShowSuggestions(true);
                        }}
                        onFocus={() => {
                            if (filters.city.length >= 2) setShowSuggestions(true);
                        }}
                    />
                    <button
                        onClick={handleLocateMe}
                        disabled={isLocating}
                        className="absolute right-0 top-0 bottom-0 my-auto text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    >
                        {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                    </button>
                    {showSuggestions && citySuggestions.length > 0 && (
                        <div className="absolute top-[calc(100%+12px)] left-[-12px] right-[-12px] bg-[#0b0c0e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            {citySuggestions.map((city, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectCity(city)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-[11px] font-semibold text-zinc-300 hover:bg-primary/10 hover:text-primary transition-colors text-left"
                                >
                                    <span>{city.nom}</span>
                                    <span className="opacity-40 text-[9px]">{city.codesPostaux?.[0]}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                <div className="relative shrink-0" ref={activePopover === 'radius' ? popoverRef : null}>
                    <button
                        onClick={() => setActivePopover(activePopover === 'radius' ? null : 'radius')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-[10px] font-bold uppercase tracking-tight ${filters.radius !== 50 ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <MapPin className="h-3 w-3" />
                        {filters.radius}km
                    </button>
                    {activePopover === 'radius' && (
                        <div className="absolute top-[calc(100%+16px)] left-1/2 -translate-x-1/2 w-48 p-4 bg-[#0b0c0e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Rayon (km)</Label>
                            <Slider
                                value={[filters.radius]}
                                max={500}
                                step={10}
                                onValueChange={(val: number[]) => onChange({ ...filters, radius: val[0] })}
                                className="mb-2"
                            />
                            <div className="text-center text-xs font-bold text-primary">{filters.radius} km</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Période */}
            <div className="relative shrink-0" ref={activePopover === 'timeframe' ? popoverRef : null}>
                <button
                    onClick={() => setActivePopover(activePopover === 'timeframe' ? null : 'timeframe')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-[11px] font-bold uppercase tracking-tight ${filters.timeframe !== 12 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-background/20 border-white/5 text-muted-foreground hover:border-white/10 hover:text-foreground'}`}
                >
                    <Calendar className="h-4 w-4" />
                    {filters.timeframe === 12 ? 'Période' : `~${filters.timeframe} mois`}
                </button>
                {activePopover === 'timeframe' && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-48 p-4 bg-[#0b0c0e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Dans les prochains...</Label>
                        <Slider
                            value={[filters.timeframe]}
                            max={12}
                            min={1}
                            step={1}
                            onValueChange={(val: number[]) => onChange({ ...filters, timeframe: val[0] })}
                            className="mb-2"
                        />
                        <div className="text-center text-xs font-bold text-primary">
                            {filters.timeframe === 12 ? 'Toute l\'année' : `${filters.timeframe} mois`}
                        </div>
                    </div>
                )}
            </div>

            {/* Format Pills */}
            <div className="flex gap-1 bg-background/20 p-1 rounded-xl border border-white/5 shrink-0">
                {formatOptions.map((opt) => {
                    const isActive = (opt === "Tous" && filters.format.length === 0) || filters.format.includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => handleFormatClick(opt)}
                            className={`px-3 py-1.5 text-[10px] rounded-lg transition-all font-bold uppercase tracking-tight active:scale-95 ${isActive
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {/* Elo Popover */}
            <div className="relative shrink-0" ref={activePopover === 'elo' ? popoverRef : null}>
                <button
                    onClick={() => setActivePopover(activePopover === 'elo' ? null : 'elo')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-[11px] font-bold uppercase tracking-tight ${filters.elo ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-background/20 border-white/5 text-muted-foreground hover:border-white/10 hover:text-foreground'}`}
                >
                    <Trophy className="h-4 w-4" />
                    {filters.elo || 'Elo'}
                </button>
                {activePopover === 'elo' && (
                    <div className="absolute top-[calc(100%+8px)] left-0 min-w-[140px] p-1 bg-[#0b0c0e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                        {eloOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => handleEloClick(opt)}
                                className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-tighter transition-colors rounded-lg ${filters.elo === (opt === "Tous" ? null : opt) ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Tri Popover */}
            <div className="relative shrink-0" ref={activePopover === 'sortBy' ? popoverRef : null}>
                <button
                    onClick={() => setActivePopover(activePopover === 'sortBy' ? null : 'sortBy')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-background/20 border-white/5 text-muted-foreground hover:border-white/10 hover:text-foreground transition-all text-[11px] font-bold uppercase tracking-tight"
                >
                    <ArrowUpDown className="h-4 w-4" />
                    {filters.sortBy === 'date' ? 'Date' : 'Proximité'}
                </button>
                {activePopover === 'sortBy' && (
                    <div className="absolute top-[calc(100%+8px)] left-0 min-w-[140px] p-1 bg-[#0b0c0e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => { onChange({ ...filters, sortBy: 'date' }); setActivePopover(null); }}
                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase rounded-lg ${filters.sortBy === 'date' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:bg-white/5'}`}
                        >
                            Date
                        </button>
                        <button
                            disabled={!filters.cityCoords}
                            onClick={() => { onChange({ ...filters, sortBy: 'distance' }); setActivePopover(null); }}
                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase rounded-lg ${!filters.cityCoords ? 'opacity-30' : ''} ${filters.sortBy === 'distance' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:bg-white/5'}`}
                        >
                            Proximité
                        </button>
                    </div>
                )}
            </div>

            <div className="w-[1px] h-6 bg-white/10 shrink-0"></div>

            {/* Icon Toggles */}
            <div className="flex items-center gap-1.5 shrink-0 px-1">
                <button
                    onClick={() => onChange({ ...filters, multiOpen: !filters.multiOpen })}
                    title="Plusieurs Opens"
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all active:scale-95 text-[10px] font-bold uppercase tracking-tight ${filters.multiOpen ? 'bg-primary/20 border-primary/40 text-primary shadow-lg shadow-primary/10' : 'bg-background/20 border-white/5 text-muted-foreground hover:bg-white/5'}`}
                >
                    <Layers className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Multi</span>
                </button>
                <button
                    onClick={() => onChange({ ...filters, hasPlayersList: !filters.hasPlayersList })}
                    title="Liste des inscrits"
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all active:scale-95 text-[10px] font-bold uppercase tracking-tight ${filters.hasPlayersList ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'bg-background/20 border-white/5 text-muted-foreground hover:bg-white/5'}`}
                >
                    <Users className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Inscrits</span>
                </button>
                <button
                    onClick={() => onChange({ ...filters, onlyShortlist: !filters.onlyShortlist })}
                    title="Mes Favoris"
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all active:scale-95 text-[10px] font-bold uppercase tracking-tight ${filters.onlyShortlist ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-lg shadow-amber-500/10' : 'bg-background/20 border-white/5 text-muted-foreground hover:bg-white/5'}`}
                >
                    <Star className={`h-3.5 w-3.5 ${filters.onlyShortlist ? 'fill-amber-500' : ''}`} />
                    <span className="hidden md:inline">Favoris</span>
                </button>
                <button
                    onClick={() => onChange({ ...filters, excludeInternal: !filters.excludeInternal })}
                    title="Sans Internes"
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all active:scale-95 text-[10px] font-bold uppercase tracking-tight ${filters.excludeInternal ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-lg shadow-rose-500/10' : 'bg-background/20 border-white/5 text-muted-foreground hover:bg-white/5'}`}
                >
                    <ShieldX className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Interne</span>
                </button>
            </div>

            <div className="w-[1px] h-6 bg-white/10 shrink-0 mx-1"></div>

            {/* Reset */}
            <button
                onClick={onReset}
                title="Réinitialiser les filtres"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-background/20 border border-white/5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all shrink-0 active:rotate-[-45deg] text-[10px] font-bold uppercase tracking-tight"
            >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Reset</span>
            </button>
        </div>
    );
}
