"use client";

import { useState, useEffect, useMemo } from "react";
import { Filters, FilterState } from "@/components/features/Filters";
import { MapWrapper } from "@/components/features/MapWrapper";
import { TournamentCard } from "@/components/features/TournamentCard";
import { Tournament } from "@/lib/types/tournament";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/features/Header";
import { ChessLoading } from "@/components/features/ChessLoading";
import { checkAlerts, AlertConfig } from "@/lib/utils/notifications";
import { fetchRouteInfo } from "@/lib/utils/osrm";

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    format: [],
    elo: null,
    hasPlayersList: false,
    multiOpen: false,
    excludeInternal: true,
    onlyShortlist: false,
    city: "",
    cityCoords: null,
    radius: 50,
    timeframe: 12,
    sortBy: 'date',
  });

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [targetCoords, setTargetCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [carResults, setCarResults] = useState<Record<string, { carDistance: string, duration: string }>>({});

  useEffect(() => {
    const saved = localStorage.getItem('echecs-shortlist');
    if (saved) {
      try { setShortlistedIds(JSON.parse(saved)); } catch (e) { /* ignore */ }
    }
  }, []);

  const toggleShortlist = (id: string) => {
    setShortlistedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem('echecs-shortlist', JSON.stringify(next));
      return next;
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const sortedTournaments = useMemo(() => {
    const basicFiltered = tournaments.filter((t) => {
      if (filters.onlyShortlist && !shortlistedIds.includes(t.id)) return false;
      if (filters.excludeInternal && t.isInternal) return false;

      // Format filter (multi-select)
      const matchesFormat = filters.format.length === 0 ||
        filters.format.includes(t.format) ||
        t.sections?.some(s => filters.format.includes(s.format));

      // Elo filter refinement
      const checkEloMatch = (eloBracket: string, targetElo: string | null) => {
        if (!targetElo || targetElo === "Tous") return true;

        const elo = eloBracket;
        if (targetElo === "-1600") return elo === "-1600";
        if (targetElo === "1600-2000") return elo === "1600-2000" || elo === "1600-2200";
        if (targetElo === "2000+") return elo === "2000+" || elo === "2100+" || elo === "2200+";
        if (targetElo === "Non classé") return elo === "Toutes catégories";

        return elo === targetElo;
      };

      const matchesElo = !filters.elo ||
        checkEloMatch(t.eloBracket, filters.elo) ||
        t.sections?.some(s => checkEloMatch(s.eloBracket, filters.elo));

      if (!matchesFormat || !matchesElo) return false;
      if (filters.hasPlayersList && !t.hasPlayersList) return false;
      if (filters.multiOpen && (!t.sections || t.sections.length < 2)) return false;

      // Date filter logic based on timeframe
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Always hide past tournaments
      if (t.date < todayStr) return false;

      if (filters.timeframe < 12) {
        const d = new Date(today);
        d.setMonth(d.getMonth() + filters.timeframe);
        const endDateStr = d.toISOString().split('T')[0];
        if (t.date > endDateStr) return false;
      }

      // Distance filter
      if (targetCoords) {
        const dist = calculateDistance(targetCoords.lat, targetCoords.lng, t.location.lat, t.location.lng);
        if (dist > filters.radius) return false;
      }

      return true;
    });

    return [...basicFiltered].sort((a, b) => {
      if (filters.sortBy === 'date') {
        return a.date.localeCompare(b.date);
      }

      if (filters.sortBy === 'distance' && targetCoords) {
        const distA = calculateDistance(targetCoords.lat, targetCoords.lng, a.location.lat, a.location.lng);
        const distB = calculateDistance(targetCoords.lat, targetCoords.lng, b.location.lat, b.location.lng);
        return distA - distB;
      }

      return 0;
    });
  }, [tournaments, filters, shortlistedIds, targetCoords]);

  useEffect(() => {
    const startTime = Date.now();
    fetch("/api/tournaments")
      .then((res) => res.json())
      .then((data) => {
        setTournaments(data.tournaments);
        setLastUpdate(data.lastUpdate);

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 3000 - elapsed);

        setTimeout(() => {
          setLoading(false);
          const savedAlerts = JSON.parse(localStorage.getItem('echecs-alerts') || '[]');
          if (savedAlerts.length > 0) {
            const matches = checkAlerts(data.tournaments, savedAlerts);
            if (matches.length > 0) {
              matches.forEach(m => {
                alert(`Nouveau tournoi trouvé : ${m.name} à ${m.location.city} !`);
              });
            }
          }
        }, remaining);
      })
      .catch((err) => {
        console.error("Failed to fetch tournaments:", err);
        setLoading(false);
      });
  }, []);

  // Fetch road distances for the top results when location changes
  useEffect(() => {
    if (!targetCoords) {
      setCarResults({});
      return;
    }

    const topTournaments = sortedTournaments.slice(0, 10);
    const fetchVisibleRoutes = async () => {
      for (const t of topTournaments) {
        if (carResults[t.id]) continue;
        const route = await fetchRouteInfo(targetCoords, { lat: t.location.lat, lng: t.location.lng });
        if (route) {
          setCarResults(prev => ({ ...prev, [t.id]: route }));
        }
        await new Promise(r => setTimeout(r, 600));
      }
    };
    fetchVisibleRoutes();
  }, [targetCoords, sortedTournaments]);

  useEffect(() => {
    if (filters.cityCoords) {
      setTargetCoords(filters.cityCoords);
      return;
    }
    if (!filters.city || filters.city.length < 3) {
      setTargetCoords(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(filters.city)}&format=json&limit=1&countrycodes=fr,ch`);
        const data = await res.json();
        if (data && data.length > 0) {
          setTargetCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      } catch (e) {
        console.error("Geocoding error:", e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [filters.city, filters.cityCoords]);

  const calculateZoom = (radius: number) => {
    if (radius <= 10) return 12;
    if (radius <= 25) return 11;
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    if (radius <= 250) return 8;
    if (radius <= 350) return 7;
    return 6;
  };

  const displayTournaments = useMemo(() => {
    return visibleIds.length > 0
      ? sortedTournaments.filter(t => visibleIds.includes(t.id))
      : sortedTournaments;
  }, [sortedTournaments, visibleIds]);

  const resetFilters = () => {
    setFilters({
      format: [],
      elo: null,
      hasPlayersList: false,
      multiOpen: false,
      excludeInternal: true,
      onlyShortlist: false,
      city: "",
      cityCoords: null,
      radius: 50,
      timeframe: 12,
      sortBy: 'date',
    });
  };

  const handleCreateAlert = () => {
    if (!filters.cityCoords || !filters.city) {
      alert("Veuillez d'abord sélectionner une ville pour créer une alerte.");
      return;
    }
    const newAlert: AlertConfig = {
      id: Date.now().toString(),
      format: filters.format.length === 1 ? filters.format[0] : 'Tous',
      radius: filters.radius,
      city: filters.city,
      lat: filters.cityCoords.lat,
      lng: filters.cityCoords.lng
    };
    const existing = JSON.parse(localStorage.getItem('echecs-alerts') || '[]');
    localStorage.setItem('echecs-alerts', JSON.stringify([...existing, newAlert]));
    alert(`Alerte créée ! Tu seras prévenu des nouveaux tournois [${newAlert.format}] à moins de ${newAlert.radius}km de ${newAlert.city}.`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-foreground">
      <Header lastUpdate={lastUpdate} />

      <div className="flex-1 relative overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* Main Application Layer - Always in DOM to allow map initialization */}
        <motion.div
          animate={{ opacity: loading ? 0.3 : 1, filter: loading ? "blur(4px)" : "blur(0px)" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col h-full w-full pointer-events-auto"
          style={{ visibility: loading && !tournaments.length ? 'hidden' : 'visible' }}
        >
          {/* Top Filter Bar */}
          <div className="px-4 md:px-8 py-4 shrink-0 flex items-center gap-4 relative z-50">
            <div className="flex-1">
              <Filters
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 md:px-8 pb-4 min-h-0 overflow-auto lg:overflow-hidden">
            <main className="h-[400px] lg:h-auto lg:flex-grow bg-muted/20 border rounded-2xl overflow-hidden shadow-sm relative z-0 shrink-0 lg:shrink">
              <MapWrapper
                tournaments={sortedTournaments}
                hoveredId={hoveredId}
                onBoundsChange={setVisibleIds}
                center={targetCoords || undefined}
                zoom={targetCoords ? calculateZoom(filters.radius) : undefined}
              />
            </main>

            <aside className="flex flex-col w-full lg:w-[380px] lg:shrink-0 border rounded-2xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden min-h-[500px] lg:min-h-0">
              <div className="p-4 border-b bg-secondary/10 shrink-0">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="font-bold text-lg tracking-tight text-foreground">Tournois</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{displayTournaments.length} résultat{displayTournaments.length !== 1 ? 's' : ''}</p>
                      <button
                        onClick={handleCreateAlert}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full transition-colors active:scale-95 shadow-sm"
                      >
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        M'alerter
                      </button>
                    </div>
                  </div>
                  {visibleIds.length > 0 && visibleIds.length < sortedTournaments.length && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-tighter opacity-70">
                      Zone visible
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20">
                {displayTournaments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-40">
                    <div className="w-12 h-12 rounded-full bg-muted mb-4 flex items-center justify-center">
                      <Search className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">Aucun tournoi trouvé</p>
                    <p className="text-xs mt-1">Essaie d'élargir tes filtres ou la zone de recherche.</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {displayTournaments.map(tournament => (
                      <motion.div
                        key={tournament.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
                      >
                        <TournamentCard
                          tournament={{
                            ...tournament,
                            carDistance: carResults[tournament.id]?.carDistance,
                            duration: carResults[tournament.id]?.duration
                          }}
                          isHovered={hoveredId === tournament.id}
                          onHover={setHoveredId}
                          isShortlisted={shortlistedIds.includes(tournament.id)}
                          onToggleShortlist={toggleShortlist}
                          distance={targetCoords ? calculateDistance(targetCoords.lat, targetCoords.lng, tournament.location.lat, tournament.location.lng) : undefined}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </aside>
          </div>
        </motion.div>

        {/* Fun Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center pointer-events-auto"
            >
              <ChessLoading />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
