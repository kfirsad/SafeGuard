import { useEffect, useState } from "react";
import { Download, Share, PlusSquare } from "lucide-react"; // הוספתי אייקונים רלוונטיים
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // לשליטה על הצגת הקומפוננטה

  useEffect(() => {
    // 1. בדיקה אם המשתמש באייפון (כי שם אין התקנה אוטומטית)
    const isDeviceIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isDeviceIOS);
    
    // אם זה אייפון ועדיין לא במצב אפליקציה - נציג את ההודעה
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    if (isDeviceIOS && !isInStandaloneMode) {
        setIsVisible(true);
    }

    // 2. בדיקה לאנדרואיד/מחשב (כרום)
    const handler = (e: any) => {
      e.preventDefault(); // מונע מכרום להקפיץ את ההודעה הרגילה והמשעממת שלו
      setDeferredPrompt(e); // שומרים את האירוע בצד כדי להשתמש בו כשנלחץ על הכפתור שלנו
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // מקפיץ את חלונית ההתקנה של המכשיר
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  // אם האפליקציה כבר מותקנת - לא מציגים כלום
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2">
      {/* כפתור סגירה למקרה שהמשתמש לא רוצה */}
      <button 
        onClick={() => setIsVisible(false)} 
        className="absolute -top-2 -right-2 bg-background border rounded-full p-1 shadow-sm z-10"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* גרסת אנדרואיד / מחשב */}
      {deferredPrompt && (
        <Button 
          onClick={handleInstallClick} 
          className="w-full h-14 bg-primary text-primary-foreground shadow-xl rounded-xl animate-in slide-in-from-bottom-10"
        >
          <Download className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start text-xs">
            <span className="font-bold text-sm">Install App</span>
            <span className="opacity-80">Add to home screen for quick access</span>
          </div>
        </Button>
      )}
      
      {/* גרסת אייפון (הוראות ידניות) */}
      {isIOS && (
        <div className="bg-card/95 backdrop-blur border p-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-10">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
                <PlusSquare className="w-6 h-6 text-primary" />
            </div>
            <div className="text-sm">
                <p className="font-bold mb-1">Install SafeGuard</p>
                <p className="text-muted-foreground mb-2">To install this app on your iPhone:</p>
                <div className="flex items-center gap-2 text-xs font-medium bg-secondary/50 p-2 rounded">
                    1. Tap <Share className="w-3 h-3 inline mx-1" /> Share below
                </div>
                <div className="flex items-center gap-2 text-xs font-medium bg-secondary/50 p-2 rounded mt-1">
                    2. Select <PlusSquare className="w-3 h-3 inline mx-1" /> Add to Home Screen
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
