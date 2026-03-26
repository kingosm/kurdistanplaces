
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface Restaurant {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    avg_rating?: number;
    review_count?: number;
    distance?: number;
}

// Custom Icons
const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); position: relative;">
            <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color};"></div>
           </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
    });
};

const restaurantIcon = createCustomIcon('#ea384c'); // Loop/Primary Color
const activeIcon = createCustomIcon('#000000'); // Bold black for hover/active highlighting
const userIcon = createCustomIcon('#3b82f6'); // Blue for user

// Custom Cluster Icon Function
const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    // Use tailwind classes in the HTML logic mapped to Kurdtrip branding
    return L.divIcon({
        html: `<div style="background-color: #ea384c; color: white; display: flex; justify-content: center; align-items: center; width: 40px; height: 40px; border-radius: 50%; font-weight: bold; font-family: sans-serif; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2); font-size: 14px;">
                ${count}
               </div>`,
        className: 'custom-cluster-icon bg-transparent',
        iconSize: L.point(40, 40, true),
    });
};

interface MapComponentProps {
    restaurants: Restaurant[];
    userLocation: { lat: number; lon: number } | null;
    className?: string;
    centerOn?: [number, number] | null;
    defaultZoom?: number;
    hoveredRestaurantId?: string | null;
}

// Map Updater Component to handle view changes
const MapUpdater = ({ center, zoom, bounds }: { center: [number, number], zoom: number, bounds?: L.LatLngBounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            map.setView(center, zoom);
        }
    }, [center, zoom, bounds, map]);
    return null;
};

export const MapComponent = ({ restaurants, userLocation, className, centerOn, defaultZoom, hoveredRestaurantId }: MapComponentProps) => {
    const defaultCenter: [number, number] = [36.1911, 44.0091]; // Erbil Default

    // Priority: centerOn > userLocation > defaultCenter
    const center = centerOn
        ? centerOn
        : (userLocation ? [userLocation.lat, userLocation.lon] as [number, number] : defaultCenter);

    // Provide state for the route coordinates
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | undefined>(undefined);
    const [routeStats, setRouteStats] = useState<{ distance: number; duration: number } | null>(null);

    // Calculated bounds to fit both points (or the route)
    const bounds = (userLocation && centerOn)
        ? L.latLngBounds([
            [userLocation.lat, userLocation.lon],
            centerOn
        ])
        : undefined;

    // Fetch OSRM Route
    useEffect(() => {
        if (!userLocation || !centerOn) {
            setRouteCoordinates(undefined);
            setRouteStats(null);
            return;
        }

        const fetchRoute = async () => {
            try {
                // OSRM expects: {lon},{lat};{lon},{lat}
                const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lon},${userLocation.lat};${centerOn[1]},${centerOn[0]}?overview=full&geometries=geojson`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const coordinates = route.geometry.coordinates;
                    // OSRM returns [lon, lat], Leaflet needs [lat, lon]
                    const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);

                    setRouteCoordinates(latLngs);
                    setRouteStats({
                        distance: route.distance, // meters
                        duration: route.duration  // seconds
                    });
                }
            } catch (error) {
                console.error("Error fetching route:", error);
                // Fallback to straight line if fetch fails
                setRouteCoordinates([
                    [userLocation.lat, userLocation.lon],
                    centerOn
                ]);
                setRouteStats(null);
            }
        };

        fetchRoute();
    }, [userLocation, centerOn]);

    // Priority: defaultZoom (if provided) > calculated based on location presence > default 12
    const zoom = defaultZoom || (userLocation ? 14 : 12);

    const formatDuration = (seconds: number) => {
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return `${hours} hr ${remainingMins} min`;
    };

    const formatDistance = (meters: number) => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    return (
        <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 ${className}`}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
                style={{ background: '#f8fafc' }}
            >
                {/* CartoDB Voyager - A beautiful, light map style */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapUpdater center={center} zoom={zoom} bounds={bounds} />

                {/* Route Line - Google Maps Style */}
                {routeCoordinates && (
                    <>
                        {/* Outer "Halo" Line for border effect */}
                        <Polyline
                            positions={routeCoordinates}
                            color="#1856b3"
                            weight={8}
                            opacity={0.6}
                            lineCap="round"
                            lineJoin="round"
                        />
                        {/* Inner Main Line */}
                        <Polyline
                            positions={routeCoordinates}
                            color="#3b82f6" // Classic Google Blue
                            weight={5}
                            opacity={1}
                            lineCap="round"
                            lineJoin="round"
                        />
                    </>
                )}

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
                        <Popup className="font-bold text-sm">
                            You are here
                        </Popup>
                    </Marker>
                )}

                {/* Restaurant Markers wrapped in Cluster Group */}
                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createClusterCustomIcon}
                    showCoverageOnHover={false}
                    maxClusterRadius={50}
                    spiderfyOnMaxZoom={true}
                >
                    {restaurants.map((restaurant) => {
                        if (!restaurant.latitude || !restaurant.longitude) return null;
                        return (
                            <Marker
                                key={restaurant.id}
                                position={[restaurant.latitude, restaurant.longitude]}
                                icon={restaurant.id === hoveredRestaurantId ? activeIcon : restaurantIcon}
                                zIndexOffset={restaurant.id === hoveredRestaurantId ? 1000 : 0}
                            >
                                <Popup>
                                    <div className="space-y-2 min-w-[200px]">
                                        {restaurant.image_url && (
                                            <div className="w-full h-24 rounded-lg overflow-hidden mb-2">
                                                <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <h3 className="font-black text-lg">{restaurant.name}</h3>
                                        <p className="text-muted-foreground text-xs line-clamp-2">{restaurant.description}</p>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-xs font-bold text-primary">
                                                {restaurant.avg_rating ? `★ ${restaurant.avg_rating.toFixed(1)}` : 'New'}
                                            </span>
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.location.href = `/restaurant/${restaurant.slug}`}>
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Trip Info Overlay Card */}
            {routeStats && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl z-[400] flex items-center gap-6 min-w-[280px] border border-black/5 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Est. Time</span>
                        <span className="text-2xl font-black text-green-600 tracking-tight">
                            {formatDuration(routeStats.duration)}
                        </span>
                    </div>
                    <div className="w-px h-8 bg-black/10" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Distance</span>
                        <span className="text-lg font-bold text-slate-700">
                            {formatDistance(routeStats.distance)}
                        </span>
                    </div>
                </div>
            )}

            {/* Overlay Gradient for nicer integration */}
            <div className="absolute inset-0 pointer-events-none border-[6px] border-white/20 rounded-3xl z-[400]" />
        </div>
    );
};
