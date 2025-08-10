import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapLeafletProps {
  target: { lat: number; lng: number };
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 16);
    }
  }, [map, points]);
  return null;
}

const MapLeaflet = ({ target }: MapLeafletProps) => {
  const [current, setCurrent] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrent({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCurrent(null),
      { enableHighAccuracy: true }
    );
  }, []);

  const polyline = useMemo(() => {
    if (!current) return [] as [number, number][];
    return [ [current.lat, current.lng] as [number, number], [target.lat, target.lng] as [number, number] ];
  }, [current, target]);

  const points = useMemo(() => {
    const arr: [number, number][] = [[target.lat, target.lng]];
    if (current) arr.unshift([current.lat, current.lng]);
    return arr;
  }, [current, target]);

  return (
    <div className="w-full h-[60vh] rounded-lg overflow-hidden border">
      <MapContainer center={[target.lat, target.lng]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {current && (
          <CircleMarker center={[current.lat, current.lng]} radius={8} pathOptions={{ color: "#3b82f6" }} />
        )}
        <CircleMarker center={[target.lat, target.lng]} radius={10} pathOptions={{ color: "#10b981" }} />
        {polyline.length === 2 && (
          <Polyline positions={polyline} pathOptions={{ color: "#6366f1", weight: 3, opacity: 0.8 }} />
        )}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
};

export default MapLeaflet;
