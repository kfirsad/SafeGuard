import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';

// --- Types ---
export interface EmergencyEvent {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "SOS" | "Normal";
  lat: number;
  lng: number;
  description: string;
  location: string;
  distance?: string;
  timestamp?: string;
  status?: string;
}

interface EventMapProps {
  events: EmergencyEvent[];
  selectedEvent: EmergencyEvent | null; // Controlled by parent
  onEventSelect: (event: EmergencyEvent | null) => void; // Tell parent to select/deselect
  onChatClick: (event: EmergencyEvent) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0px'
};

const LIBRARIES: ("marker" | "drawing" | "geometry" | "localContext" | "places" | "visualization")[] = ['marker'];

const buttonStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '80px',
  color: 'black',
  right: '10px',
  zIndex: 10,
  backgroundColor: 'white',
  border: 'none',
  borderRadius: '20px',
  padding: '10px 20px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const DEFAULT_CENTER = { lat: 32.3424, lng: 34.9116 };

const ICONS = {
  SOS: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  NORMAL: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  USER: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
};

const AdvancedMarker = ({ map, position, icon, onClick, title }: any) => {
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    let markerInstance: any = null;
    
    const initMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        if (!AdvancedMarkerElement) return;

        const img = document.createElement('img');
        img.src = icon;
        img.width = 32;
        img.height = 32;
        img.title = title || '';

        markerInstance = new AdvancedMarkerElement({
          map,
          position,
          content: img,
          title: title,
          gmpClickable: true,
        });

        if (onClick) {
            markerInstance.addListener('click', onClick);
        }
        markerRef.current = markerInstance;
      } catch (error) {
        console.error(error);
      }
    };

    initMarker();

    return () => {
      if (markerInstance) markerInstance.map = null;
    };
  }, [map, position, icon, onClick, title]);

  return null;
};

const EventMap: React.FC<EventMapProps> = ({ events, selectedEvent, onEventSelect, onChatClick }) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBwzetcbdfIxTd_bMwou3qymNteXUuZQyw",
    libraries: LIBRARIES,
  });

  // --- Effect: Focus map when selectedEvent changes ---
  useEffect(() => {
    if (selectedEvent && mapInstance) {
        const newPos = { lat: selectedEvent.lat, lng: selectedEvent.lng };
        mapInstance.panTo(newPos);
        // Optional: slight zoom in if needed, but keeping user context is usually better
        // mapInstance.setZoom(15); 
    }
  }, [selectedEvent, mapInstance]);

  const handleNavigate = (event: any) => {
    if (!event) return;
    const destination = `${event.lat},${event.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapInstance(map);
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMapInstance(null);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const handleRecenter = () => {
    if (mapInstance && userPos) {
      mapInstance.panTo(userPos);
      mapInstance.setZoom(15);
    } else {
      alert("Location not found");
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userPos || DEFAULT_CENTER} 
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapId: "38b93d472d0ccd67ae96d1e0",
          disableDefaultUI: false,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: false, 
          panControl: false,
          cameraControl: false,
        }}
      >
        {mapInstance && (
          <>
            {userPos && (
              <AdvancedMarker
                map={mapInstance}
                position={userPos}
                icon={ICONS.USER}
                title="My Location"
              />
            )}

            {events.map(ev => (
              <AdvancedMarker
                key={ev.id}
                map={mapInstance}
                position={{ lat: ev.lat, lng: ev.lng }}
                icon={(ev.severity === 'critical' || ev.severity === 'SOS') ? ICONS.SOS : ICONS.NORMAL}
                title={ev.type}
                // When clicking a marker, tell parent to select it
                onClick={() => onEventSelect(ev)} 
              />
            ))}
          </>
        )}

        {/* InfoWindow logic now depends on the PROPS selectedEvent */}
        {selectedEvent && (
          <InfoWindow
            key={selectedEvent.id}
            position={{ lat: selectedEvent.lat, lng: selectedEvent.lng }}
            onCloseClick={() => onEventSelect(null)} // Tell parent to deselect
            options={{ pixelOffset: new google.maps.Size(0, -40) }}
          >
            <div style={{ 
              color: 'black', 
              direction: 'ltr', 
              textAlign: 'left', 
              padding: '10px',
              minWidth: '200px' 
            }}>
              <h3 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '16px', textTransform: 'capitalize' }}>
                {selectedEvent.type}
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>{selectedEvent.description}</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666' }}>📍 {selectedEvent.location}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={() => handleNavigate(selectedEvent)}
                  style={{
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🚗</span> Navigate
                </button>

                <button 
                  onClick={() => onChatClick(selectedEvent)}
                  style={{
                    backgroundColor: '#34A853',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>💬</span> Event Chat
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <button style={buttonStyle} onClick={handleRecenter}>
        <span>📍</span> My Location
      </button>
    </div>

  );

};
export default EventMap;
