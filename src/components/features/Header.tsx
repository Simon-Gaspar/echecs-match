"use client";

import { History } from "lucide-react";
import { UserAccount } from "./UserAccount";

interface HeaderProps {
    lastUpdate: string | null;
}

export function Header({ lastUpdate }: HeaderProps) {
    return (
        <header className="px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
                    <span className="text-primary-foreground font-black text-xl">♟</span>
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-2">
                        ECHECS<span className="text-primary">MATCH</span>
                    </h1>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 leading-none">
                        Plateforme fédérale unifiée
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {lastUpdate && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-full border border-border/40">
                        <History className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                            {new Date(lastUpdate).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                )}
                <UserAccount />
            </div>
        </header>
    );
}
