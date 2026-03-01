"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
    User,
    LogOut,
    Settings,
    Trophy,
    Bell,
    ChevronDown,
    Shield,
    Mail,
    UserCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProfileModal } from "./ProfileModal";

export function UserAccount() {
    const { user, login, logout, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Profile Modal State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login(email);
            setIsSuccess(true);
            setTimeout(() => {
                setShowLoginModal(false);
                setIsSuccess(false);
            }, 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />;
    }

    if (!user) {
        return (
            <>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    className="font-bold border-2 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl"
                >
                    Connexion
                </Button>

                <AnimatePresence>
                    {showLoginModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowLoginModal(false)}
                                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-md bg-card border-2 shadow-2xl rounded-3xl p-8 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />

                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                        <Trophy className="w-8 h-8 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tighter uppercase">Rejoindre la partie</h2>
                                    <p className="text-sm text-muted-foreground text-center mt-1">
                                        Synchronisez vos favoris et vos alertes sur tous vos appareils.
                                    </p>
                                </div>

                                {isSuccess ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-4"
                                    >
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <h3 className="text-lg font-bold">Lien envoyé !</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Vérifiez votre boîte mail pour vous connecter instantanément.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <>
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        required
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="votre@email.com"
                                                        className="w-full bg-muted/30 border-2 border-transparent focus:border-primary focus:bg-background h-12 rounded-2xl pl-12 pr-4 outline-none transition-all font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 mt-4"
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                                        Envoi...
                                                    </div>
                                                ) : "Se connecter / S'inscrire"}
                                            </Button>
                                        </form>

                                        <p className="text-[10px] text-center text-muted-foreground mt-8 uppercase tracking-widest font-bold opacity-40">
                                            Aucun mot de passe requis. Nous vous envoyons un lien magique.
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence >
            </>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-1 pr-3 py-1 bg-secondary/30 hover:bg-secondary/50 rounded-full border-2 border-transparent hover:border-border transition-all group"
            >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 bg-background">
                    <img alt="User" src={user.avatar} className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{user.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold tracking-widest">{user.elo || 'Non classé'} Elo</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-64 bg-card border-2 shadow-xl rounded-2xl overflow-hidden z-[70] p-2"
                        >
                            <div className="p-3 border-b-2 border-muted/30 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Statut Fédéral</p>
                                <div className="flex items-center gap-2">
                                    <div className="p-1 px-2 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                                        Licence {user.license || 'N/A'}
                                    </div>
                                    <div className="p-1 px-2 rounded-md bg-secondary text-secondary-foreground text-[10px] font-bold uppercase">
                                        Actif
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <MenuItem
                                    icon={<UserCircle />}
                                    label="Mon Profil"
                                    onClick={() => { setIsOpen(false); setIsProfileModalOpen(true); }}
                                />
                                <MenuItem icon={<Trophy />} label="Mes Résultats" />
                                <MenuItem icon={<Settings />} label="Paramètres" />
                            </div>

                            <div className="mt-2 pt-2 border-t-2 border-muted/30">
                                <button
                                    onClick={() => { logout(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-xs font-bold"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Déconnexion
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
}

function MenuItem({ icon, label, badge, onClick }: { icon: React.ReactNode, label: string, badge?: string, onClick?: () => void }) {
    return (
        <button onClick={onClick} className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted rounded-xl transition-colors group">
            <div className="flex items-center gap-3">
                <span className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors">{icon}</span>
                <span className="text-xs font-bold">{label}</span>
            </div>
            {badge && (
                <span className="text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{badge}</span>
            )}
        </button>
    );
}
