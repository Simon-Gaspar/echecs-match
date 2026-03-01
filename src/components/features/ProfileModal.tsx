"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { User, MapPin, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, updateProfile } = useAuth();

    // Profile Edit State
    const [editName, setEditName] = useState("");
    const [editElo, setEditElo] = useState("");
    const [editCity, setEditCity] = useState("");
    const [cityCoords, setCityCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [citySuggestions, setCitySuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setEditName(user.name || "");
            setEditElo(user.elo?.toString() || "");
            // Load default city from profile
            loadDefaultCity();
        }
    }, [isOpen, user]);

    const loadDefaultCity = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('default_city, default_lat, default_lng')
            .eq('id', user.id)
            .single();
        if (data?.default_city) {
            setEditCity(data.default_city);
            if (data.default_lat && data.default_lng) {
                setCityCoords({ lat: Number(data.default_lat), lng: Number(data.default_lng) });
            }
        }
    };

    // City autocomplete
    useEffect(() => {
        if (editCity.length < 3) {
            setCitySuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(editCity)}&format=json&limit=5&countrycodes=fr,ch`
                );
                const data = await res.json();
                setCitySuggestions(data || []);
                setShowSuggestions(true);
            } catch {
                setCitySuggestions([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [editCity]);

    const selectCity = (suggestion: { display_name: string; lat: string; lon: string }) => {
        const cityName = suggestion.display_name.split(',')[0].trim();
        setEditCity(cityName);
        setCityCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
        setShowSuggestions(false);
        setCitySuggestions([]);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const updates: Record<string, unknown> = {
            name: editName,
            elo: editElo ? parseInt(editElo) : null,
        };

        // Save default city separately (not in UserProfile type)
        if (editCity && cityCoords) {
            await supabase.from('profiles').update({
                default_city: editCity,
                default_lat: cityCoords.lat,
                default_lng: cityCoords.lng,
            }).eq('id', user!.id);
        } else if (!editCity) {
            await supabase.from('profiles').update({
                default_city: null,
                default_lat: null,
                default_lng: null,
            }).eq('id', user!.id);
        }

        await updateProfile(updates as any);
        setIsSaving(false);
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-card border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter uppercase">{user.name}</h2>
                            <p className="text-xs text-muted-foreground font-bold tracking-widest">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                    <div className="space-y-6 max-w-md mx-auto">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom d'affichage</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="mt-1 w-full bg-background border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Classement Elo</label>
                                <input
                                    type="number"
                                    value={editElo}
                                    onChange={(e) => setEditElo(e.target.value)}
                                    placeholder="Ex: 1540"
                                    className="mt-1 w-full bg-background border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    Ma ville (centrage automatique)
                                </label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={editCity}
                                        onChange={(e) => {
                                            setEditCity(e.target.value);
                                            setCityCoords(null);
                                        }}
                                        onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                                        placeholder="Ex: Nantes, Lyon, Genève..."
                                        className="w-full bg-background border rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                {showSuggestions && citySuggestions.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full bg-card border rounded-xl shadow-xl overflow-hidden">
                                        {citySuggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectCity(s)}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                                            >
                                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span className="truncate">{s.display_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {cityCoords && (
                                    <p className="text-[10px] text-emerald-500 mt-1 ml-1 font-bold">
                                        ✓ Ville validée — la carte se centrera ici à chaque visite
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs"
                        >
                            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
