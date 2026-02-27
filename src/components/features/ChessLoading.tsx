"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { useState, useEffect } from "react";

const CHESS_PHRASES = [
    "Blundering my queen...",
    "Thinking like Magnus...",
    "En Passant or Riot...",
    "Consulting Stockfish 17...",
    "Castle early, castle late...",
    "Sacrificing the bishop...",
    "Calculating 42 variations...",
    "Polishing the pawns..."
];

export function ChessLoading() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % CHESS_PHRASES.length);
        }, 1800);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="relative w-16 h-16">
                <motion.div
                    className="absolute inset-0 border-4 border-primary/20 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-0 border-4 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary animate-pulse" />
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
