"use client";

import { useEffect, useState } from "react";
import { Flame, CalendarCheck, CalendarClock } from "lucide-react";

interface CountdownBadgeProps {
    date: string;
}

export function CountdownBadge({ date }: CountdownBadgeProps) {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);

    useEffect(() => {
        const target = new Date(date);
        const now = new Date();
        // Reset hours to compare dates only
        target.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysLeft(diff);
    }, [date]);

    if (daysLeft === null) return null;

    const isPast = daysLeft < 0;
    const isToday = daysLeft === 0;
    const isSoon = daysLeft > 0 && daysLeft <= 7;

    if (isPast) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 text-zinc-500 text-xs font-bold">
                <CalendarCheck className="w-4 h-4" />
                Terminé
            </div>
        );
    }

    if (isToday) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider animate-pulse">
                <Flame className="w-4 h-4" />
                Aujourd&apos;hui !
            </div>
        );
    }

    if (isSoon) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider">
                <CalendarClock className="w-4 h-4" />
                Dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/8 border border-blue-500/15 text-blue-400 text-xs font-bold">
            <CalendarClock className="w-4 h-4" />
            Dans {daysLeft} jours
        </div>
    );
}
