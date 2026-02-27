"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Tournament } from "@/lib/types/tournament";

// Custom premium marker icon using divIcon for Tailwind styling and pulsing effect
const createCustomIcon = (tournament: Tournament, isHovered: boolean) => {
    const { format } = tournament;
    // Color based on format
    let colorClass = "bg-blue-500 shadow-blue-500/50";
    if (format === "Blitz") colorClass = "bg-red-500 shadow-red-500/50";
    if (format === "Rapide") colorClass = "bg-amber-500 shadow-amber-500/50";

    const baseSize = isHovered ? "w-6 h-6" : "w-4 h-4";
    const coreSize = isHovered ? "w-3 h-3" : "w-2 h-2";
    const zIndex = isHovered ? 1000 : 0;

    return L.divIcon({
        className: "custom-div-icon",
        html: `
            <div class="relative flex items-center justify-center ${baseSize} transition-all duration-300" style="z-index: ${zIndex}">
                <div class="absolute w-full h-full rounded-full ${colorClass} opacity-30 ${isHovered ? 'animate-pulse' : ''}"></div>
                <div class="relative ${coreSize} rounded-full ${colorClass} border border-white/50 shadow-sm transition-all duration-300"></div>
            </div>
        `,
        iconSize: isHovered ? [24, 24] : [16, 16],
        iconAnchor: isHovered ? [12, 12] : [8, 8],
    });
};

interface TournamentMapProps {
    tournaments: Tournament[];
    hoveredId?: string | null;
    onBoundsChange?: (ids: string[]) => void;
    center?: { lat: number; lng: number };
    zoom?: number;
}

function MapEvents({ onBoundsChange, tournaments }: {
    onBoundsChange?: (ids: string[]) => void,
    tournaments: Tournament[]
}) {
    const map = useMapEvents({
        moveend: () => {
            if (!onBoundsChange) return;
            const bounds = map.getBounds();
            const visibleIds = tournaments
                .filter(t => bounds.contains([t.location.lat, t.location.lng]))
                .map(t => t.id);
            onBoundsChange(visibleIds);
        },
        zoomend: () => {
            if (!onBoundsChange) return;
            const bounds = map.getBounds();
            const visibleIds = tournaments
                .filter(t => bounds.contains([t.location.lat, t.location.lng]))
                .map(t => t.id);
            onBoundsChange(visibleIds);
        }
    });
    return null;
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, zoom, map]);
    return null;
}

export default function TournamentMap({ tournaments, hoveredId, onBoundsChange, center: searchCenter, zoom: searchZoom }: TournamentMapProps) {
    const [center, setCenter] = useState<[number, number]>([46.2276, 2.2137]);
    const [zoom, setZoom] = useState(6);

    // Initial map bounding on France
    // Removed automatic geolocation to maintain the global view by default as requested.

    // Update map view when search city or radius changes
    useEffect(() => {
        if (searchCenter) {
            setCenter([searchCenter.lat, searchCenter.lng]);
            if (searchZoom) setZoom(searchZoom);
        }
    }, [searchCenter, searchZoom]);

    const markers = useMemo(() => {
        return tournaments.map((tournament) => (
            <Marker
                key={tournament.id}
                position={[tournament.location.lat, tournament.location.lng]}
                icon={createCustomIcon(tournament, tournament.id === hoveredId)}
            >
                <Popup className="premium-popup">
                    <div className="p-1 min-w-[200px] text-white">
                        <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-2 uppercase tracking-tight">
                            {tournament.name}
                        </h4>
                        <div className="flex items-center text-[10px] text-zinc-400 mb-3 font-medium">
                            <span className="uppercase tracking-wider mr-2">{tournament.location.city}</span>
                            <span className="opacity-50">•</span>
                            <span className="ml-2">{tournament.date}</span>
                        </div>
                        {!tournament.sections ? (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800">
                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border ${tournament.format === 'Blitz' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    tournament.format === 'Rapide' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    }`}>
                                    {tournament.format}
                                </span>
                                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] rounded-full font-semibold border border-zinc-700">
                                    {tournament.eloBracket}
                                </span>
                                {tournament.hasPlayersList && (
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full font-semibold border border-emerald-500/30">
                                        Liste Inscrits
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                                {tournament.sections.map((s, idx) => (
                                    <a key={idx} href={s.homologationLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-zinc-900/50 hover:bg-zinc-800 p-1.5 rounded border border-zinc-800/50 transition-colors">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-bold text-zinc-500 min-w-[30px] uppercase truncate">{s.name.split(' ').pop()}</span>
                                            <span className={`px-1.5 py-0 rounded text-[8px] font-bold uppercase ${s.format === 'Blitz' ? 'text-red-400 bg-red-400/10' : s.format === 'Rapide' ? 'text-amber-400 bg-amber-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                                                {s.format}
                                            </span>
                                            <span className="text-[9px] text-zinc-400 font-medium truncate">{s.eloBracket}</span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 text-zinc-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </a>
                                ))}
                            </div>
                        )}
                        {!tournament.sections && (
                            <a
                                href={tournament.homologationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 block w-full text-center py-2 bg-primary text-primary-foreground text-[11px] font-bold rounded-md hover:brightness-110 transition-all border border-primary/20"
                            >
                                VOIR LA FICHE FFE
                            </a>
                        )}
                    </div>
                </Popup>
            </Marker>
        ));
    }, [tournaments, hoveredId]);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%", zIndex: 10, background: '#0b0c0e' }}
            scrollWheelZoom={true}
            minZoom={4}
            maxBounds={[[-90, -180], [90, 180]]}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                noWrap={true}
            />

            <MapUpdater center={center} zoom={zoom} />
            <MapEvents onBoundsChange={onBoundsChange} tournaments={tournaments} />

            {markers}
        </MapContainer>
    );
}
