"use client";

import { Share2, CalendarPlus, Check, Copy, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Tournament } from "@/lib/types/tournament";
import { Button } from "@/components/ui/button";

interface TournamentActionsProps {
    tournament: Tournament;
}

export function TournamentActions({ tournament }: TournamentActionsProps) {
    const [copied, setCopied] = useState(false);
    const [showCalendarOptions, setShowCalendarOptions] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/tournaments/${tournament.id}` : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateGoogleCalendarUrl = () => {
        const title = encodeURIComponent(tournament.name);
        const details = encodeURIComponent(`Retrouve tous les détails sur Echecs Match : ${shareUrl}`);
        const location = encodeURIComponent(`${tournament.location.city}, ${tournament.location.address || ''}`);

        // Start date: tournament date at 9:00 AM (default)
        const startDate = new Date(tournament.date);
        startDate.setHours(9, 0, 0);

        // End date: tournament date at 6:00 PM (default)
        const endDate = new Date(tournament.date);
        endDate.setHours(18, 0, 0);

        const formatForGoogle = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}`;
    };

    const handleDownloadIcs = () => {
        const title = tournament.name;
        const description = `Détails : ${shareUrl}`;
        const location = `${tournament.location.city}, ${tournament.location.address || ''}`;

        const startDate = new Date(tournament.date);
        startDate.setHours(9, 0, 0);
        const endDate = new Date(tournament.date);
        endDate.setHours(18, 0, 0);

        const formatForIcs = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${formatForIcs(startDate)}`,
            `DTEND:${formatForIcs(endDate)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${tournament.id}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
                {/* Calendar Button */}
                <div className="relative">
                    <Button
                        onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                        variant="secondary"
                        className="h-10 rounded-xl font-bold text-xs gap-2 bg-background/40 hover:bg-background/80 border-white/5"
                    >
                        <CalendarPlus className="w-4 h-4 text-primary" />
                        Ajouter au calendrier
                    </Button>

                    {showCalendarOptions && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-[#0b0c0e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 p-1 animate-in zoom-in-95 duration-200">
                            <a
                                href={generateGoogleCalendarUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center px-3 py-2 text-[10px] font-bold uppercase tracking-tight text-zinc-300 hover:bg-primary/10 hover:text-primary transition-colors rounded-lg"
                            >
                                Google Calendar
                            </a>
                            <button
                                onClick={handleDownloadIcs}
                                className="w-full flex items-center px-3 py-2 text-[10px] font-bold uppercase tracking-tight text-zinc-300 hover:bg-primary/10 hover:text-primary transition-colors rounded-lg"
                            >
                                Apple / Outlook (.ics)
                            </button>
                        </div>
                    )}
                </div>

                {/* Share Dropdown */}
                <div className="flex gap-2">
                    <Button
                        onClick={handleCopy}
                        variant="secondary"
                        className="h-10 w-10 p-0 rounded-xl bg-background/40 hover:bg-background/80 border-white/5"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>

                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${tournament.name} - ${shareUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button variant="secondary" className="h-10 w-10 p-0 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/10">
                            <Share2 className="w-4 h-4 text-emerald-500" />
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
}
