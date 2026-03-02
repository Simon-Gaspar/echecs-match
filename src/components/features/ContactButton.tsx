"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Handshake, MessageSquarePlus, Mail, Send, ChevronRight, Sparkles } from "lucide-react";

interface ContactPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

function ContactPanel({ isOpen, onClose }: ContactPanelProps) {
    const [activeTab, setActiveTab] = useState<'partner' | 'suggest'>('partner');
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // mailto fallback — opens user's email client with pre-filled content
        const subject = activeTab === 'partner'
            ? `[EchecsMatch] Proposition de partenariat — ${formData.name}`
            : `[EchecsMatch] Suggestion d'amélioration — ${formData.name}`;
        const body = `De: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`;
        window.open(`mailto:simon.gaspar@pm.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', message: '' });
        }, 3000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                        className="fixed inset-x-4 bottom-4 top-auto md:inset-auto md:bottom-8 md:right-8 md:w-[440px] bg-background border border-border/60 rounded-2xl shadow-2xl shadow-black/30 z-[201] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-6 pt-6 pb-4">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-emerald-500" />
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div>
                                    <h2 className="font-black text-lg tracking-tight">Contactez-nous</h2>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                                        Partenariats & améliorations
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 flex gap-2">
                            <button
                                onClick={() => setActiveTab('partner')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'partner'
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                                    }`}
                            >
                                <Handshake className="w-3.5 h-3.5" />
                                Partenariat
                            </button>
                            <button
                                onClick={() => setActiveTab('suggest')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'suggest'
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                                    }`}
                            >
                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                Suggestion
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 pt-4 pb-6">
                            {/* Info Card */}
                            <div className="mb-4 p-3 rounded-xl bg-secondary/20 border border-border/30">
                                {activeTab === 'partner' ? (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Vous êtes un <span className="font-bold text-foreground">club</span>, une <span className="font-bold text-foreground">fédération</span>, ou un <span className="font-bold text-foreground">organisateur</span> ?
                                        Proposez un partenariat pour intégrer vos tournois, vos annonces, ou co-développer de nouvelles fonctionnalités.
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Une idée de <span className="font-bold text-foreground">fonctionnalité</span>, un <span className="font-bold text-foreground">bug</span> à signaler, ou une <span className="font-bold text-foreground">amélioration</span> à proposer ?
                                        On est à l&apos;écoute pour faire évoluer la plateforme.
                                    </p>
                                )}
                            </div>

                            {/* Form */}
                            <AnimatePresence mode="wait">
                                {submitted ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-8 text-center"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                                            <Send className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <p className="font-bold text-sm">Message envoyé !</p>
                                        <p className="text-xs text-muted-foreground mt-1">Merci, on revient vers vous rapidement.</p>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-3"
                                    >
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Votre nom"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="flex-1 px-3 py-2 rounded-xl bg-secondary/30 border border-border/40 text-xs font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                className="flex-1 px-3 py-2 rounded-xl bg-secondary/30 border border-border/40 text-xs font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                        <textarea
                                            placeholder={activeTab === 'partner' ? "Décrivez votre projet de partenariat..." : "Décrivez votre suggestion ou le bug rencontré..."}
                                            required
                                            rows={4}
                                            value={formData.message}
                                            onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border/40 text-xs font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                                        />
                                        <button
                                            type="submit"
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 transition-all active:scale-[0.98]"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            Envoyer
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {/* Quick Links */}
                            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <a
                                        href="mailto:simon.gaspar@pm.me"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wide transition-colors"
                                    >
                                        <Mail className="w-3 h-3" />
                                        Email direct
                                    </a>
                                </div>
                                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                                    v1.0
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function ContactButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-[199] flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-shadow group"
            >
                <Handshake className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Contact</span>
                <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>

            {/* Contact Panel */}
            <ContactPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
