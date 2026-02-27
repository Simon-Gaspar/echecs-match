import { ThemeToggle } from "@/components/theme-toggle";
import { Castle } from "lucide-react";

interface HeaderProps {
    lastUpdate?: string | null;
}

export function Header({ lastUpdate }: HeaderProps) {
    const formattedDate = lastUpdate
        ? new Date(lastUpdate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center gap-4 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mr-4 text-primary shrink-0">
                    <Castle className="h-6 w-6" />
                    <span className="font-bold text-lg tracking-tight">Échecs Match</span>
                </div>
                {formattedDate && (
                    <div className="hidden sm:block text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-70">
                        Dernière mise à jour : {formattedDate}
                    </div>
                )}
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Espace pour barre de recherche éventuelle */}
                    </div>
                    <nav className="flex items-center">
                        <ThemeToggle />
                    </nav>
                </div>
            </div>
        </header>
    );
}
