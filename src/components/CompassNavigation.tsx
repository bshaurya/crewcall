import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompassNavigationProps {
  target: { lat: number; lng: number };
}

const CompassNavigation = ({ target }: CompassNavigationProps) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180/Math.PI + 360) % 360;
  };

  const startNavigation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsActive(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(currentPos);
        
        const dist = calculateDistance(currentPos.lat, currentPos.lng, target.lat, target.lng);
        setDistance(dist);
        
        const bearing = calculateBearing(currentPos.lat, currentPos.lng, target.lat, target.lng);
        setHeading(bearing);

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPosition(currentPos);
            
            const dist = calculateDistance(currentPos.lat, currentPos.lng, target.lat, target.lng);
            setDistance(dist);
            
            const bearing = calculateBearing(currentPos.lat, currentPos.lng, target.lat, target.lng);
            setHeading(bearing);
          },
          (error) => {
            console.warn("Location update failed:", error.message);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 30000 
          }
        );
      },
      (error) => {
        console.error("Initial location failed:", error.message);
        alert(`Location access failed: ${error.message}. Please enable location services.`);
        setIsActive(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 60000 
      }
    );
  };

  const stopNavigation = () => {
    setIsActive(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isActive || !position) return;

    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
    }

    let vibrationInterval = 3000;
    let vibrationDuration = 100;

    if (distance < 10) {
      vibrationInterval = 200;
      vibrationDuration = 200;
    } else if (distance < 25) {
      vibrationInterval = 500;
      vibrationDuration = 150;
    } else if (distance < 50) {
      vibrationInterval = 1000;
      vibrationDuration = 100;
    } else if (distance < 100) {
      vibrationInterval = 2000;
    }

    if (navigator.vibrate) {
      vibrationIntervalRef.current = setInterval(() => {
        navigator.vibrate(vibrationDuration);
      }, vibrationInterval);
    }

    return () => {
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
      }
    };
  }, [distance, isActive, position]);

  useEffect(() => {
    return () => {
      stopNavigation();
    };
  }, []);

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compass Navigation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          {!isActive ? (
            <Button onClick={startNavigation}>Start Navigation</Button>
          ) : (
            <Button variant="destructive" onClick={stopNavigation}>Stop Navigation</Button>
          )}
        </div>

        {isActive && position && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDistance(distance)}</div>
              <div className="text-sm text-muted-foreground">to destination</div>
            </div>

            <div className="flex justify-center">
              <div className="relative w-32 h-32 border-2 border-gray-300 rounded-full">
                <div className="absolute inset-2 border border-gray-200 rounded-full"></div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold">N</div>
                <div 
                  className="absolute top-1/2 left-1/2 w-1 h-12 bg-red-500 origin-bottom transform -translate-x-1/2 -translate-y-full transition-transform duration-300"
                  style={{ transform: `translate(-50%, -100%) rotate(${heading}deg)` }}
                >
                  <div className="absolute -top-2 -left-1 w-3 h-3 bg-red-500 transform rotate-45"></div>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <div>Bearing: {Math.round(heading)}°</div>
              <div className="mt-2">
                {distance < 10 && "🔥 Very close! Vibrating rapidly"}
                {distance >= 10 && distance < 25 && "📍 Close! Frequent vibrations"}
                {distance >= 25 && distance < 50 && "🎯 Nearby. Regular vibrations"}
                {distance >= 50 && distance < 100 && "🚶 Getting closer"}
                {distance >= 100 && "🗺️ Keep walking"}
              </div>
            </div>
          </div>
        )}

        {!position && isActive && (
          <div className="text-center text-muted-foreground">
            Getting your location...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompassNavigation;