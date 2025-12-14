import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Event } from './EventCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key, AlertTriangle, Loader2 } from 'lucide-react';

interface EventMapProps {
  events: Event[];
  onEventClick: (eventId: string) => void;
}

// Mock coordinates for events (in real app, events would have lat/lng)
const mockCoordinates: Record<string, { lat: number; lng: number }> = {
  "1": { lat: 40.7484, lng: -73.9857 },
  "2": { lat: 40.7520, lng: -73.9800 },
  "3": { lat: 40.7600, lng: -73.9700 },
  "4": { lat: 40.7400, lng: -73.9900 },
};

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 40.7484, lng: -73.9857 };

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a9a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1f1f3a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2a1a" }] },
];

const EventMap = ({ events, onEventClick }: EventMapProps) => {
  const [apiKey, setApiKey] = useState(() => 
    localStorage.getItem('google_maps_api_key') || 'AIzaSyBwzetcbdfIxTd_bMwou3qymNteXUuZQyw'
  );
  const [keyInput, setKeyInput] = useState(apiKey);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const saveApiKey = () => {
    localStorage.setItem('google_maps_api_key', keyInput);
    setApiKey(keyInput);
    window.location.reload(); // Reload to reinitialize the map with new key
  };

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="glass-card p-6 max-w-md w-full space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <Key className="w-6 h-6" />
            <h3 className="text-lg font-semibold text-foreground">Google Maps API Key Required</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            To display the map, please enter your Google Maps API key. You can get one from{' '}
            <a 
              href="https://console.cloud.google.com/google/maps-apis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Cloud Console
            </a>
            {' '}→ Credentials section.
          </p>

          <div className="space-y-3">
            <Input
              type="text"
              placeholder="AIza..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button 
              onClick={saveApiKey} 
              variant="emergency" 
              className="w-full"
              disabled={!keyInput}
            >
              Save & Load Map
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <MapWithKey apiKey={apiKey} events={events} onEventClick={onEventClick} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} />;
};

interface MapWithKeyProps {
  apiKey: string;
  events: Event[];
  onEventClick: (eventId: string) => void;
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
}

const MapWithKey = ({ apiKey, events, onEventClick, selectedEvent, setSelectedEvent }: MapWithKeyProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const onMapClick = useCallback(() => {
    setSelectedEvent(null);
  }, [setSelectedEvent]);

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="glass-card p-6 max-w-md w-full space-y-4 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">Failed to load map</h3>
          <p className="text-sm text-muted-foreground">
            Please check your API key and ensure the Maps JavaScript API is enabled.
          </p>
          <Button 
            onClick={() => {
              localStorage.removeItem('google_maps_api_key');
              window.location.reload();
            }}
            variant="outline"
          >
            Enter New API Key
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        onClick={onMapClick}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {events.map((event) => {
          const coords = mockCoordinates[event.id];
          if (!coords) return null;

          return (
            <Marker
              key={event.id}
              position={coords}
              onClick={() => setSelectedEvent(event)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: severityColors[event.severity],
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              }}
            />
          );
        })}

        {selectedEvent && mockCoordinates[selectedEvent.id] && (
          <InfoWindow
            position={mockCoordinates[selectedEvent.id]}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <div className="p-2 min-w-[200px]">
              <div 
                className="text-xs font-bold uppercase mb-1"
                style={{ color: severityColors[selectedEvent.severity] }}
              >
                {selectedEvent.severity}
              </div>
              <h3 className="font-semibold text-gray-900 capitalize mb-1">
                {selectedEvent.type}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedEvent.location}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {selectedEvent.distance} away • {selectedEvent.timestamp}
              </p>
              <button
                onClick={() => onEventClick(selectedEvent.id)}
                className="w-full bg-red-500 text-white text-sm py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                View Details
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

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
