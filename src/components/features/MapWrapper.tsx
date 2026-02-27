"use client";

import dynamic from "next/dynamic";
import { Tournament } from "@/lib/types/tournament";

const DynamicMap = dynamic(() => import("./TournamentMap"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full w-full bg-muted/20 animate-pulse text-muted-foreground">Chargement de la carte...</div>
});

interface MapWrapperProps {
    tournaments: Tournament[];
    hoveredId?: string | null;
    onBoundsChange?: (ids: string[]) => void;
    center?: { lat: number; lng: number };
    zoom?: number;
}

export function MapWrapper({ tournaments, hoveredId, onBoundsChange, center, zoom }: MapWrapperProps) {
    return <DynamicMap tournaments={tournaments} hoveredId={hoveredId} onBoundsChange={onBoundsChange} center={center} zoom={zoom} />;
}
