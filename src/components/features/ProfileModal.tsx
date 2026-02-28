"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Trash2, User, Bell, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserAlert {
    id: string;
    format: string;
    radius: number;
    city: string;
    created_at: string;
}

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'profile' | 'alerts';
}

export function ProfileModal({ isOpen, onClose, initialTab = 'profile' }: ProfileModalProps) {
    const { user, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'alerts'>(initialTab);
    const [alerts, setAlerts] = useState<UserAlert[]>([]);
    const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

    // Profile Edit State
    const [editName, setEditName] = useState("");
    const [editLicense, setEditLicense] = useState("");
    const [editElo, setEditElo] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            if (user) {
                setEditName(user.name || "");
                setEditLicense(user.license || "");
                setEditElo(user.elo?.toString() || "");
                if (initialTab === 'alerts' || activeTab === 'alerts') {
                    fetchAlerts();
                }
            }
        }
    }, [isOpen, initialTab, user]);

    useEffect(() => {
        if (activeTab === 'alerts' && user) {
            fetchAlerts();
        }
    }, [activeTab]);

    const fetchAlerts = async () => {
        if (!user) return;
        setIsLoadingAlerts(true);
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setAlerts(data);
        }
        setIsLoadingAlerts(false);
    };

    const handleDeleteAlert = async (alertId: string) => {
        if (!user) return;
        setAlerts(alerts.filter(a => a.id !== alertId)); // Optimistic UI
        await supabase.from('alerts').delete().eq('id', alertId).eq('user_id', user.id);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        await updateProfile({
            name: editName,
            license: editLicense || undefined,
            elo: editElo ? parseInt(editElo) : undefined
        });
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
                className="relative w-full max-w-2xl bg-card border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
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

                {/* Tabs */}
                <div className="flex p-4 gap-2 border-b bg-muted/30 shrink-0 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'
                            }`}
                    >
                        <User className="w-4 h-4" /> Mon Profil
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'alerts' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'
                            }`}
                    >
                        <Bell className="w-4 h-4" /> Mes Alertes
                        {alerts.length > 0 && (
                            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                {alerts.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                    {activeTab === 'profile' && (
                        <div className="space-y-6 max-w-md">
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">N° Licence FFE</label>
                                        <input
                                            type="text"
                                            value={editLicense}
                                            onChange={(e) => setEditLicense(e.target.value)}
                                            placeholder="Ex: A123456"
                                            className="mt-1 w-full bg-background border rounded-xl px-4 py-3 text-sm uppercase font-medium outline-none focus:border-primary transition-all"
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
                    )}

                    {activeTab === 'alerts' && (
                        <div className="space-y-4">
                            {isLoadingAlerts ? (
                                <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">
                                    Chargement de vos radars d'échecs...
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-muted/30">
                                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mx-auto mb-3 shadow-sm">
                                        <Bell className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="font-bold text-foreground">Aucune alerte active</p>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
                                        Utilisez le bouton "M'alerter" sur la carte pour être prévenu des nouveaux tournois près de chez vous.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {alerts.map(alert => (
                                        <div key={alert.id} className="flex items-center justify-between bg-background border p-4 rounded-2xl hover:border-primary/50 transition-colors group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm">
                                                        {alert.city} <span className="text-muted-foreground font-normal">({alert.radius}km)</span>
                                                    </h4>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                        Format : <span className="text-foreground">{alert.format}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAlert(alert.id)}
                                                className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Supprimer cette alerte"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
