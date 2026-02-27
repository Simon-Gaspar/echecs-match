"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Calendar, MapPin, Search, Trophy, History, RotateCcw, LocateFixed, Loader2, ArrowUpDown } from "lucide-react";

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
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
        const timeout = setTimeout(async () => {
            // Only fetch if we have at least 2 chars and the dropdown could be shown
            if (!filters.city || filters.city.length < 2) {
                setCitySuggestions([]);
                return;
            }
            if (!showSuggestions) return;

            try {
                // geo.api.gouv.fr is a free, robust, and no-key API for French cities
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
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Reverse geocode to get city name
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
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 bg-secondary/30 p-4 rounded-xl border border-border/50 backdrop-blur-sm shadow-sm">
            {/* Localisation */}
            <div className="flex-1 min-w-[200px] space-y-1.5">
                <div className="flex items-center gap-2 text-primary opacity-80">
                    <MapPin className="h-3.5 w-3.5" />
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Ville / Rayon</Label>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1" ref={wrapperRef}>
                        <Search className="absolute left-2 top-0 bottom-0 my-auto h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Paris, Lyon..."
                            className="pl-7 pr-8 text-[11px] h-8 bg-background/50 border-none shadow-none focus-visible:ring-1"
                            value={filters.city}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                // If they start typing, reset the fixed coords so Nominatim geocodes it again
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
                            className="absolute right-2 top-0 bottom-0 my-auto text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 h-3.5 w-3.5 flex items-center justify-center"
                        >
                            {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5 hover:scale-110 transition-transform" />}
                        </button>
                        {showSuggestions && citySuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700/50 rounded-md shadow-xl z-50 overflow-hidden">
                                {citySuggestions.map((city, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectCity(city)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium text-zinc-300 hover:bg-primary/20 hover:text-primary transition-colors focus:bg-primary/20 focus:outline-none"
                                    >
                                        <span>{city.nom}</span>
                                        <span className="opacity-50 text-[10px] ml-2">{city.codesPostaux?.[0]}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="w-24 px-1 pt-3">
                        <Slider
                            value={[filters.radius]}
                            max={500}
                            step={10}
                            onValueChange={(val: number[]) => onChange({ ...filters, radius: val[0] })}
                        />
                    </div>
                    <span className="text-[10px] font-medium pt-2 min-w-[2.2rem] tabular-nums">{filters.radius}km</span>
                </div>
            </div>
            {/* Période Slider */}
            <div className="space-y-1.5 w-[140px] shrink-0">
                <div className="flex items-center gap-2 text-primary opacity-80">
                    <Calendar className="h-3.5 w-3.5" />
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Période</Label>
                </div>
                <div className="bg-background/40 p-2 rounded-lg border border-border/20 space-y-2">
                    <div className="px-1 pt-1">
                        <Slider
                            value={[filters.timeframe]}
                            max={12}
                            min={1}
                            step={1}
                            onValueChange={(val: number[]) => onChange({ ...filters, timeframe: val[0] })}
                        />
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground text-center">
                        {filters.timeframe === 12 ? 'Toute l\'année' : `Dans les ${filters.timeframe} mois`}
                    </div>
                </div>
            </div>

            {/* Cadence */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-primary opacity-80">
                    <History className="h-3.5 w-3.5" />
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Format</Label>
                </div>
                <div className="flex gap-1 bg-background/40 p-0.5 rounded-lg border border-border/20">
                    {formatOptions.map((opt) => {
                        const isActive = (opt === "Tous" && filters.format.length === 0) || filters.format.includes(opt);
                        return (
                            <button
                                key={opt}
                                onClick={() => handleFormatClick(opt)}
                                className={`px-2 py-1 text-[10px] rounded-md transition-all font-semibold active:scale-95 ${isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    }`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Elo */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-primary opacity-80">
                    <Trophy className="h-3.5 w-3.5" />
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Elo</Label>
                </div>
                <div className="flex gap-1 bg-background/40 p-0.5 rounded-lg border border-border/20">
                    {eloOptions.map((opt) => {
                        const isActive = (opt === "Tous" && !filters.elo) || filters.elo === opt;
                        return (
                            <button
                                key={opt}
                                onClick={() => handleEloClick(opt)}
                                className={`px-2 py-1 text-[10px] rounded-md transition-all font-semibold active:scale-95 ${isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    }`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tri */}
            <div className="space-y-1.5 border-l border-border/30 pl-6 h-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-primary opacity-80">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Tri</Label>
                </div>
                <div className="flex gap-1 bg-background/40 p-0.5 rounded-lg border border-border/20">
                    <button
                        onClick={() => onChange({ ...filters, sortBy: 'date' })}
                        className={`px-3 py-1 text-[10px] rounded-md transition-all font-semibold active:scale-95 ${filters.sortBy === 'date'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            }`}
                    >
                        Date
                    </button>
                    <button
                        disabled={!filters.cityCoords}
                        onClick={() => onChange({ ...filters, sortBy: 'distance' })}
                        className={`px-3 py-1 text-[10px] rounded-md transition-all font-semibold active:scale-95 transition-opacity ${!filters.cityCoords ? 'opacity-30 cursor-not-allowed' : ''} ${filters.sortBy === 'distance'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            }`}
                    >
                        Proximité
                    </button>
                </div>
            </div>

            {/* Toggles & Actions */}
            <div className="flex items-center gap-1 self-end bg-background/40 p-1 rounded-xl border border-border/20 h-14">
                <Label htmlFor="multi-open" className="flex items-center gap-3 px-3 py-1 cursor-pointer hover:bg-background/80 transition-colors rounded-lg group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight group-hover:text-foreground transition-colors">Plusieurs</span>
                        <span className="text-[9px] font-bold text-primary uppercase transition-colors">Opens</span>
                    </div>
                    <div className="pointer-events-none">
                        <Switch
                            id="multi-open"
                            checked={filters.multiOpen}
                            onCheckedChange={(checked) => onChange({ ...filters, multiOpen: checked })}
                            className="scale-[0.85] shadow-sm data-[state=checked]:bg-primary"
                        />
                    </div>
                </Label>

                <div className="w-[1px] h-8 bg-border/50 mx-1"></div>

                <Label htmlFor="players-list" className="flex items-center gap-3 px-3 py-1 cursor-pointer hover:bg-background/80 transition-colors rounded-lg group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight group-hover:text-foreground transition-colors">Liste</span>
                        <span className="text-[9px] font-bold text-primary uppercase transition-colors">Inscrits</span>
                    </div>
                    <div className="pointer-events-none">
                        <Switch
                            id="players-list"
                            checked={filters.hasPlayersList}
                            onCheckedChange={(checked) => onChange({ ...filters, hasPlayersList: checked })}
                            className="scale-[0.85] shadow-sm data-[state=checked]:bg-emerald-500"
                        />
                    </div>
                </Label>

                <div className="w-[1px] h-8 bg-border/50 mx-1"></div>

                <Label htmlFor="only-shortlist" className="flex items-center gap-3 px-3 py-1 cursor-pointer hover:bg-background/80 transition-colors rounded-lg group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight group-hover:text-foreground transition-colors">Mes</span>
                        <span className="text-[9px] font-bold text-amber-500 uppercase transition-colors">Favoris</span>
                    </div>
                    <div className="pointer-events-none">
                        <Switch
                            id="only-shortlist"
                            checked={filters.onlyShortlist}
                            onCheckedChange={(checked) => onChange({ ...filters, onlyShortlist: checked })}
                            className="scale-[0.85] shadow-sm data-[state=checked]:bg-amber-500"
                        />
                    </div>
                </Label>

                <div className="w-[1px] h-8 bg-border/50 mx-1"></div>

                <Label htmlFor="exclude-internal" className="flex items-center gap-3 px-3 py-1 cursor-pointer hover:bg-background/80 transition-colors rounded-lg group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight group-hover:text-foreground transition-colors">Sans</span>
                        <span className="text-[9px] font-bold text-rose-500 uppercase transition-colors">Internes</span>
                    </div>
                    <div className="pointer-events-none">
                        <Switch
                            id="exclude-internal"
                            checked={filters.excludeInternal}
                            onCheckedChange={(checked) => onChange({ ...filters, excludeInternal: checked })}
                            className="scale-[0.85] shadow-sm data-[state=checked]:bg-rose-500"
                        />
                    </div>
                </Label>

                <div className="w-[1px] h-8 bg-border/50 mx-1"></div>

                <button
                    onClick={onReset}
                    className="h-full px-4 hover:bg-muted/80 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                </button>
            </div>
        </div>
    );
}
