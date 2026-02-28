"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Database } from "lucide-react";
import { useState, useEffect } from "react";

const CHESS_PHRASES = [
    "Analyse de la base de données FFE...",
    "Récupération des tournois suisses...",
    "Géocodage des adresses de jeu...",
    "Mise à jour des listes d'inscrits...",
    "Calcul de l'Elo moyen des joueurs...",
    "Détection des cadences de jeu...",
    "Préparation de la carte interactive..."
];

function Counter({ from, to }: { from: number, to: number }) {
    const count = useMotionValue(from);
    const rounded = useTransform(count, Math.round);

    useEffect(() => {
        const animation = animate(count, to, { duration: 2, ease: "easeOut" });
        return animation.stop;
    }, []);

    return <motion.span>{rounded}</motion.span>;
}

export function ChessLoading() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % CHESS_PHRASES.length);
        }, 1800);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-1 text-5xl md:text-7xl font-black text-primary tracking-tighter drop-shadow-sm">
                    <Counter from={0} to={850} />
                    <span className="text-3xl md:text-5xl text-primary/80">+</span>
                </div>
                <div className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Tournois Actifs Centralisés
                </div>
            </div>
            <div className="h-8 flex flex-col items-center justify-center overflow-hidden text-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={index}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "backOut" }}
                        className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-4"
                    >
                        {CHESS_PHRASES[index]}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
}
