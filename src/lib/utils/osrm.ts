export async function fetchRouteInfo(start: { lat: number, lng: number }, end: { lat: number, lng: number }) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceKm = (route.distance / 1000).toFixed(1);

            const totalSeconds = route.duration;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            let durationStr = "";
            if (hours > 0) durationStr += `${hours}h `;
            durationStr += `${minutes}m`;

            return {
                carDistance: `${distanceKm} km`,
                duration: durationStr
            };
        }
    } catch (e) {
        console.error("OSRM routing error:", e);
    }
    return null;
}
