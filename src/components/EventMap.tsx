import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from './EventCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Key, AlertTriangle } from 'lucide-react';

interface EventMapProps {
  events: Event[];
  onEventClick: (eventId: string) => void;
}

// Mock coordinates for events (in real app, events would have lat/lng)
const mockCoordinates: Record<string, [number, number]> = {
  "1": [-73.9857, 40.7484], // NYC area
  "2": [-73.9800, 40.7520],
  "3": [-73.9700, 40.7600],
  "4": [-73.9900, 40.7400],
};

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const EventMap = ({ events, onEventClick }: EventMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState(() => 
    localStorage.getItem('mapbox_token') || ''
  );
  const [tokenInput, setTokenInput] = useState(mapboxToken);
  const [isTokenValid, setIsTokenValid] = useState(!!mapboxToken);
  const [isLoading, setIsLoading] = useState(false);

  const saveToken = () => {
    setIsLoading(true);
    localStorage.setItem('mapbox_token', tokenInput);
    setMapboxToken(tokenInput);
    setIsTokenValid(true);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-73.9857, 40.7484],
        zoom: 12,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add markers for events
      events.forEach((event) => {
        const coords = mockCoordinates[event.id];
        if (!coords) return;

        const el = document.createElement('div');
        el.className = 'event-marker';
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background: ${severityColors[event.severity]};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 0 20px ${severityColors[event.severity]}80;
            border: 3px solid white;
            transition: transform 0.2s;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `;

        el.addEventListener('click', () => onEventClick(event.id));
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong style="color: ${severityColors[event.severity]}; text-transform: uppercase;">
                  ${event.severity}
                </strong>
                <p style="margin: 4px 0; font-weight: 600;">${event.type}</p>
                <p style="margin: 0; font-size: 12px; color: #666;">${event.location}</p>
                <p style="margin: 4px 0 0; font-size: 11px; color: #888;">${event.distance} away</p>
              </div>
            `)
          )
          .addTo(map.current!);

        markersRef.current.push(marker);
      });

      return () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current?.remove();
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setIsTokenValid(false);
    }
  }, [mapboxToken, events, onEventClick]);

  if (!isTokenValid || !mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="glass-card p-6 max-w-md w-full space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <Key className="w-6 h-6" />
            <h3 className="text-lg font-semibold text-foreground">Mapbox Token Required</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            To display the map, please enter your Mapbox public token. You can get one from{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
            {' '}→ Tokens section in your dashboard.
          </p>

          <div className="space-y-3">
            <Input
              type="text"
              placeholder="pk.eyJ1..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button 
              onClick={saveToken} 
              variant="emergency" 
              className="w-full"
              disabled={!tokenInput || isLoading}
            >
              {isLoading ? 'Validating...' : 'Save & Load Map'}
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your token is stored locally and never sent to our servers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-3 space-y-2">
        <p className="text-xs font-semibold text-foreground">Severity</p>
        <div className="space-y-1">
          {Object.entries(severityColors).map(([severity, color]) => (
            <div key={severity} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground capitalize">{severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventMap;
