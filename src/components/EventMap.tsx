import React, { useEffect, useRef, useState, useCallback } from 'react';

import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';



const containerStyle = {

  width: '100%',

  height: '600px',

  borderRadius: '15px'

};



// ✅ קבוע מחוץ לקומפוננטה (מונע ריענונים מיותרים של המפה)

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



const mockEvents = [

  { id: 'ev1', type: 'תאונת דרכים - SOS', severity: 'SOS', lat: 32.3351609, lng: 34.8922542, desc: 'התנגשות חזיתית' },

  { id: 'ev2', type: 'חשד לפח"ע', severity: 'SOS', lat: 32.3462632, lng: 34.9167057, desc: 'דמות חשודה' },

  { id: 'ev3', type: 'אירוע רפואי', severity: 'Normal', lat: 32.3499168, lng: 34.8724600, desc: 'עזרה רפואית' },

  { id: 'ev4', type: 'שריפה', severity: 'SOS', lat: 32.3649513, lng: 34.9021512, desc: 'עשן סמיך' }

];



// --- רכיב AdvancedMarker ---

const AdvancedMarker = ({ map, position, icon, onClick, title }: any) => {

  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);



  useEffect(() => {

    if (!map) return;



    const img = document.createElement('img');

    img.src = icon;

    img.width = 32;

    img.height = 32;

    img.title = title || '';



    const marker = new google.maps.marker.AdvancedMarkerElement({

      map,

      position,

      content: img,

      title: title,

      gmpClickable: true,

    });



    const listener = marker.addListener('click', onClick);

    markerRef.current = marker;



    return () => {

      marker.map = null;

      google.maps.event.removeListener(listener);

    };

  }, [map, position, icon, onClick, title]);



  return null;

};



// --- הקומפוננטה הראשית ---

const EventMap: React.FC = () => {

  const mapRef = useRef<google.maps.Map | null>(null);

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [loadingLocation, setLoadingLocation] = useState(true);



  const { isLoaded } = useJsApiLoader({

    googleMapsApiKey: "AIzaSyBwzetcbdfIxTd_bMwou3qymNteXUuZQyw",

    //libraries: LIBRARIES,

  });

  //nav func

    const handleNavigate = (event: any) => {
    if (!event) return;
    
    // נקודת מוצא: המיקום שלך (אם קיים), נקודת יעד: מיקום האירוע
    const origin = userPos ? `${userPos.lat},${userPos.lng}` : "";
    const destination = `${event.lat},${event.lng}`;
    
    // בניית URL לניווט (מצב נסיעה)
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    window.open(url);
  };


  //open chat func
  const handleOpenChat = (event: any) => {
    if (!event || !event.id) return;
    
    
    const chatUrl = `https://shobproject.diburit.app/report/${event.id}/chat`;
    
    window.open(chatUrl);
  };

  const onLoad = useCallback((map: google.maps.Map) => {

    mapRef.current = map;

    setMapInstance(map);

  }, []);



  const onUnmount = useCallback(() => {

    mapRef.current = null;

    setMapInstance(null);

  }, []);



  // ✅ תיקון ה-GPS: שימוש ב-Cache למניעת "היעלמות" בריענון

  useEffect(() => {

    let isMounted = true;



    // טיימר גיבוי: אם ה-GPS לא עונה תוך 10 שניות, נשחרר את המפה

    const timeoutId = setTimeout(() => {

      if (isMounted) {

        console.log("GPS timeout - defaulting map");

        setLoadingLocation(false);

      }

    }, 10000);



    if (!navigator.geolocation) {

      setLoadingLocation(false);

      return;

    }



    navigator.geolocation.getCurrentPosition(

      (pos) => {

        if (!isMounted) return;

        clearTimeout(timeoutId);

        console.log("Location found via GPS/Cache");

        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });

        setLoadingLocation(false);

      },

      (err) => {

        if (!isMounted) return;

        clearTimeout(timeoutId);

        console.warn('GPS Error:', err.message);

        setLoadingLocation(false);

      },

      { 

        enableHighAccuracy: true, 

        timeout: 2500, 

        maximumAge: Infinity // ⬅️ קריטי: משתמש במיקום אחרון ידוע אם קיים (פותר בעיות ריענון)

      }

    );





    return () => {

      isMounted = false;

      clearTimeout(timeoutId);

    };

  }, []);



  const handleRecenter = () => {

    if (mapInstance && userPos) {

      mapInstance.panTo(userPos);

      mapInstance.setZoom(15);

    } else {

      alert("לא זוהה מיקום עבור המכשיר שלך");

    }

  };



  if (!isLoaded) return <div>טוען ספריות מפה...</div>;



  if (loadingLocation) {

    return (

      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>

        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'black', direction: 'rtl'}}>📍 מחפש מיקום...</span>

      </div>

    );

  }



  return (

    <div style={{ position: 'relative', height: '600px', width: '100%' }}>

      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userPos || DEFAULT_CENTER} 
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapId: "38b93d472d0ccd67ae96d1e0", 
          disableDefaultUI: false,
        }}
      >
        {mapInstance && (
          <>
            {userPos && (
              <AdvancedMarker
                map={mapInstance}
                position={userPos}
                icon={ICONS.USER}
                title="המיקום שלי"
                onClick={() => {}}
              />
            )}

            {mockEvents.map(ev => (
              <AdvancedMarker
                key={ev.id}
                map={mapInstance}
                position={{ lat: ev.lat, lng: ev.lng }}
                icon={ev.severity === 'SOS' ? ICONS.SOS : ICONS.NORMAL}
                title={ev.type}
                onClick={() => setSelectedEvent(ev)}
              />
            ))}
          </>
        )}

        {selectedEvent && (
          <InfoWindow
            key={selectedEvent.id}
            position={{ lat: selectedEvent.lat, lng: selectedEvent.lng }}
            onCloseClick={() => setSelectedEvent(null)}
            options={{ pixelOffset: new google.maps.Size(0, -40) }}
          >
            {/* כל מה שבתוך ה-div הזה יופיע בתוך הבלון של המפה */}
            <div style={{ 
              color: 'black', 
              direction: 'rtl', 
              textAlign: 'right', 
              padding: '10px',
              minWidth: '180px' 
            }}>
              <h3 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '16px' }}>{selectedEvent.type}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>{selectedEvent.desc}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* כפתור ניווט */}
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
                  <span>🚗</span> ניווט לאירוע
                </button>

                {/* כפתור צ'אט */}
                <button 
                  onClick={() => handleOpenChat(selectedEvent)}
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
                  <span>💬</span> צ'אט אירוע
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>





      <button style={buttonStyle} onClick={handleRecenter}>

        <span>📍</span> המיקום שלי

      </button>


    </div>

  );

};



export default EventMap;