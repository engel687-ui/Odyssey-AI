import React, { useEffect, useState, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
// Fallback to Leaflet if Google Maps key is restricted
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup as LeafletPopup, Polyline as LeafletPolyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import type { RouteStop } from '@/types';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface MapViewProps {
  routeStops: RouteStop[];
  startLocation: string;
  endLocation: string;
}

export function MapView({ routeStops, startLocation, endLocation }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [vehicleMarker, setVehicleMarker] = useState<any>(null);
  const [vehiclePosition, setVehiclePosition] = useState<number>(0);
  const [routePath, setRoutePath] = useState<any[]>([]);
  const [googleFailed, setGoogleFailed] = useState<boolean>(false);

  // Playback controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5x, 1x, 2x
  const intervalRef = useRef<number | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    let didCancel = false;
    let mapInitTimeout: number | null = null;
    let resizeHandler: (() => void) | null = null;

    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['geometry'],
      });

      try {
        await loader.load();

        if (didCancel) return;

        if (!window.google || !window.google.maps) {
          console.warn('Google Maps loaded but window.google.maps is not available');
          setGoogleFailed(true);
          return;
        }

        const mapInstance = new window.google.maps.Map(mapRef.current!, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 8,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        const directionsServiceInstance = new window.google.maps.DirectionsService();
        const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
          polylineOptions: {
            strokeColor: '#059669',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          },
          suppressMarkers: false,
        });

        directionsRendererInstance.setMap(mapInstance);

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);

        // Ensure map renders correctly if its container was hidden during initialization
        // (e.g. inside modals or tabs). Trigger a resize shortly after init and on window resize.
        const triggerResize = () => {
          try {
            if ((window as any).google && mapInstance) {
              (window as any).google.maps.event.trigger(mapInstance, 'resize');
              const center = mapInstance.getCenter && mapInstance.getCenter();
              if (center && mapInstance.setCenter) mapInstance.setCenter(center);
            }
          } catch (e) {
            // ignore
          }
        };

        // Initial resize attempt
        setTimeout(() => triggerResize(), 250);

        // Add resize listener to keep map responsive
        resizeHandler = () => triggerResize();
        window.addEventListener('resize', resizeHandler);

        // If the map container doesn't have height or Google Maps doesn't visibly initialize
        // within a short timeout, fall back to Leaflet to avoid blank white screens.
        mapInitTimeout = window.setTimeout(() => {
          try {
            const height = mapRef.current?.offsetHeight || 0;
            if (!height || !mapInstance || !mapInstance.getDiv) {
              console.warn('Map failed to initialize visually - falling back to Leaflet');
              setGoogleFailed(true);
            }
          } catch (err) {
            console.warn('Error while checking map initialization:', err);
            setGoogleFailed(true);
          }
        }, 1500);
      } catch (error: any) {
        // If Google Maps fails to authenticate (RefererNotAllowedMapError) or other errors,
        // gracefully fall back to a Leaflet-based map so the UI remains functional.
        console.error('Failed to load Google Maps:', error);
        setGoogleFailed(true);
      }
    };

    initMap();

    return () => {
      didCancel = true;
      if (mapInitTimeout) window.clearTimeout(mapInitTimeout);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  // Calculate route when locations change
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !startLocation || !endLocation) return;

    const waypoints = routeStops
      .filter((stop) => stop.type === 'poi' || stop.type === 'charging')
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .slice(1, -1) // Remove first and last (start/end)
      .map((stop) => ({
        location: new window.google.maps.LatLng(stop.latitude, stop.longitude),
        stopover: true,
      }));

    const request: any = {
      origin: startLocation,
      destination: endLocation,
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);

        // Extract route path for vehicle animation
        const path: any[] = [];
        result.routes[0].legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            step.path?.forEach((point) => {
              path.push(point);
            });
          });
        });
        setRoutePath(path);
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }, [directionsService, directionsRenderer, startLocation, endLocation, routeStops]);

  // Add custom markers for route stops (Google Maps)
  useEffect(() => {
    if (!map) return;

    const markers: any[] = [];

    routeStops.forEach((stop) => {
      const iconColor = stop.type === 'charging'
        ? '#3B82F6'
        : stop.type === 'accommodation'
          ? '#059669'
          : '#F59E0B';

      const iconSymbol = stop.type === 'charging'
        ? '⚡'
        : stop.type === 'accommodation'
          ? '🏨'
          : '📍';

      const marker = new window.google.maps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map: map,
        title: stop.name,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg width="30" height="45" viewBox="0 0 30 45" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C6.7 0 0 6.7 0 15c0 14.6 15 30 15 30s15-15.4 15-30C30 6.7 23.3 0 15 0z" fill="${iconColor}"/>
              <circle cx="15" cy="15" r="8" fill="white"/>
              <text x="15" y="20" text-anchor="middle" font-size="12" fill="${iconColor}">${iconSymbol}</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(30, 45),
          anchor: new window.google.maps.Point(15, 45),
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3">
            <h3 class="font-semibold text-gray-900 mb-1">${stop.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${stop.description || ''}</p>
            ${stop.amenities ? `
              <div class="flex flex-wrap gap-1">
                ${JSON.parse(stop.amenities).map((amenity: string) => 
                  `<span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">${amenity}</span>`
                ).join('')}
              </div>
            ` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, routeStops]);

  // Animate vehicle along route (Google Maps)
  useEffect(() => {
    if (!map || !routePath.length) return;

    // Create or update vehicle marker
    if (!vehicleMarker && routePath.length > 0) {
      const marker = new window.google.maps.Marker({
        position: routePath[0],
        map: map,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg width="50" height="40" viewBox="0 0 50 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                </filter>
              </defs>
              
              <!-- Pulse ring -->
              <circle cx="25" cy="20" r="10" fill="none" stroke="#059669" stroke-width="1" opacity="0.6">
                <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
              </circle>
              
              <!-- Vehicle body -->
              <rect x="8" y="12" width="34" height="12" rx="4" fill="#059669" filter="url(#shadow)"/>
              
              <!-- Wheels -->
              <circle cx="16" cy="28" r="4" fill="#374151"/>
              <circle cx="34" cy="28" r="4" fill="#374151"/>
              
              <!-- Windows -->
              <rect x="10" y="14" width="8" height="4" fill="white" opacity="0.9"/>
              <rect x="20" y="14" width="12" height="4" fill="white" opacity="0.9"/>
              <rect x="34" y="14" width="6" height="4" fill="white" opacity="0.9"/>
              
              <!-- EV Badge -->
              <rect x="20" y="4" width="10" height="5" rx="2" fill="#ffffff" stroke="#059669" stroke-width="1"/>
              <text x="25" y="8" text-anchor="middle" font-size="8" fill="#059669" font-weight="bold">EV</text>
              
              <!-- Lightning bolt -->
              <path d="M27 10 L26 12 L27.5 12 L26.5 14 L28 12 L26.5 12 Z" fill="#fbbf24"/>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(50, 40),
          anchor: new window.google.maps.Point(25, 20),
        },
        zIndex: 1000,
      });
      setVehicleMarker(marker);
    }

    // Clear existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only animate if playing
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setVehiclePosition((prev) => {
          const increment = 0.3 * speed; // speed multiplier
          const next = prev + increment;
          const position = next > 100 ? 0 : next;

          if (vehicleMarker && routePath.length > 0) {
            const pathIndex = Math.floor((position / 100) * (routePath.length - 1));
            if (pathIndex < routePath.length) {
              vehicleMarker.setPosition(routePath[pathIndex]);
            }
          }

          return position;
        });
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [map, routePath, vehicleMarker, isPlaying, speed]);

  // Leaflet fallback: create simple polyline and animated marker using leaflet
  const LeafletPlayback: React.FC = () => {
    const map = useMap();
    const [leafletPath, setLeafletPath] = useState<L.LatLngExpression[]>([]);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
      if (!routeStops.length) return;
      const path = routeStops.map((s) => [s.latitude, s.longitude] as L.LatLngExpression);
      setLeafletPath(path);

      // Add or update marker
      if (!markerRef.current && path.length) {
        markerRef.current = L.marker(path[0], {
          icon: L.divIcon({ className: 'leaflet-vehicle-marker', html: '<svg width="40" height="28"><rect x="4" y="6" width="32" height="12" rx="4" fill="#059669"/></svg>' }),
          zIndexOffset: 1000,
        }).addTo(map);
      }
    }, [routeStops]);

    // Playback interval for leaflet marker
    useEffect(() => {
      if (!markerRef.current || leafletPath.length === 0) return;

      let pos = 0;
      let animInterval: number | null = null;

      if (isPlaying) {
        animInterval = window.setInterval(() => {
          pos = (pos + Math.max(1, Math.floor(1 * speed))) % (leafletPath.length || 1);
          markerRef.current?.setLatLng(leafletPath[pos]);
        }, 200);
      }

      return () => {
        if (animInterval) window.clearInterval(animInterval);
      };
    }, [leafletPath, isPlaying, speed]);

    // Draw polyline on the map via Leaflet API to avoid typing mismatches with react-leaflet props
    useEffect(() => {
      let pl: L.Polyline | null = null;
      try {
        if (leafletPath.length) {
          pl = L.polyline(leafletPath as any, { color: '#059669', weight: 4 }).addTo(map);
        }
      } catch (err) {
        console.error('Failed to draw leaflet polyline', err);
      }
      return () => {
        if (pl) map.removeLayer(pl);
      };
    }, [leafletPath, map]);

    return null;
  };

  return (
    <div className="h-full w-full relative">
      {/* If Google Maps failed to load (key/referer issues), show Leaflet fallback */}
      {googleFailed ? (
// @ts-ignore - allow flexible center typing for Leaflet fallback
        <MapContainer
          center={routeStops.length ? ([routeStops[0].latitude, routeStops[0].longitude] as [number, number]) : ([37.7749, -122.4194] as [number, number])}
          zoom={8}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {routeStops.map((stop) => (
            <LeafletMarker key={stop.id} {...({ position: [stop.latitude, stop.longitude] as L.LatLngExpression, draggable: true, eventHandlers: {
              dragend: (e: any) => {
                const marker = e.target as L.Marker;
                const { lat, lng } = marker.getLatLng();
                // TODO: emit change to parent or update DB - for now log
                console.log('Marker dragged to', lat, lng);
              }
            } } as any)}>
              <LeafletPopup>
                <div>
                  <strong>{stop.name}</strong>
                  <div>{stop.description}</div>
                </div>
              </LeafletPopup>
            </LeafletMarker>
          ))}

          {/* Leaflet playback component */}
          <LeafletPlayback />
        </MapContainer>
      ) : (
        <div ref={mapRef} className="h-full w-full" />
      )}

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 z-[1000] space-y-3 w-44">
        <div className="bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm font-medium">EV Vehicle</span>
            </div>
            <div className="text-xs text-gray-500">{Math.round(vehiclePosition)}%</div>
          </div>

          <div className="mt-3 flex items-center space-x-2">
            <button
              className="px-2 py-1 bg-primary text-white rounded-md text-sm"
              onClick={() => setIsPlaying((p) => !p)}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <div className="flex-1">
              <label className="text-xs text-gray-500">Speed</label>
              <div className="flex items-center space-x-2 mt-1">
                <button className={`px-2 py-1 rounded-md text-sm ${speed === 0.5 ? 'bg-gray-200' : 'bg-white'}`} onClick={() => setSpeed(0.5)}>0.5x</button>
                <button className={`px-2 py-1 rounded-md text-sm ${speed === 1 ? 'bg-gray-200' : 'bg-white'}`} onClick={() => setSpeed(1)}>1x</button>
                <button className={`px-2 py-1 rounded-md text-sm ${speed === 2 ? 'bg-gray-200' : 'bg-white'}`} onClick={() => setSpeed(2)}>2x</button>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <input
              type="range"
              min={0}
              max={100}
              value={vehiclePosition}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVehiclePosition(v);
                // When manually seeking, update marker position immediately
                if (vehicleMarker && routePath.length > 0) {
                  const idx = Math.floor((v / 100) * (routePath.length - 1));
                  vehicleMarker.setPosition(routePath[idx]);
                }
              }}
              className="w-full"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Charging Station</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
            <span className="text-sm">Accommodation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-sm">Point of Interest</span>
          </div>
        </div>
      </div>
    </div>
  );
}