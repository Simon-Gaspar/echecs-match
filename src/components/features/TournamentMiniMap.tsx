"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MiniMapProps {
    lat: number;
    lng: number;
    cityName: string;
}

export function TournamentMiniMap({ lat, lng, cityName }: MiniMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Custom marker icon to match the app aesthetic
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                    <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });

        const map = L.map(mapRef.current, {
            zoomControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            attributionControl: false
        }).setView([lat, lng], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map);

        L.marker([lat, lng], { icon }).addTo(map);

        mapInstance.current = map;

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [lat, lng]);

    return (
        <div className="relative group w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <div ref={mapRef} className="w-full h-full z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Localisation</span>
                <span className="text-sm font-bold text-white">{cityName}</span>
            </div>
            {/* Open in Google Maps */}
            <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/10 transition-all text-white text-[10px] font-bold uppercase tracking-tight active:scale-95"
            >
                Itinéraire
            </a>
        </div>
    );
}
