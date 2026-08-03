import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../utils/translations';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issues in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PH_BOUNDS: LatLngBoundsExpression = [
  [4.5, 116.0], // South West
  [21.5, 127.0] // North East
];

const MOCK_LOCATIONS = [
  "Mercedes Port, Camarines Norte",
  "Estancia Shoreline, Iloilo",
  "Navotas Fish Port",
  "General Santos Fish Port Complex",
  "Zamboanga City Pier"
];

const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      // Strictly restrict reference point selection to Philippine bounds
      if (lat >= 4.5 && lat <= 21.5 && lng >= 116.0 && lng <= 127.0) {
        onLocationSelect(lat, lng);
      } else {
        alert("Please select a coordinate point inside the Philippine coastal waters.");
      }
    },
  });
  return null;
};

export const OnboardingView: React.FC = () => {
  const navigate = useNavigate();
  const { language, setReferencePoint, setUser } = useAppState();
  const t = translations[language];

  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [mockLocationName, setMockLocationName] = useState<string>('');

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedPoint({ lat, lng });
    // Random mock location for demonstration
    const randomLocation = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
    setMockLocationName(randomLocation);
  };

  const handleConfirm = () => {
    if (selectedPoint) {
      setReferencePoint({
        lat: selectedPoint.lat,
        lng: selectedPoint.lng,
        locationName: mockLocationName,
      });
      setUser((prev) => prev ? { ...prev, isOnboarded: true } : null);
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="p-6 bg-white z-10 shadow-sm border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.setReferencePoint}</h2>
        <p className="text-teal-600 text-sm font-medium">{t.mapInstructions}</p>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[12.8797, 121.7740]} // Center of Philippines
          zoom={6}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          maxBounds={PH_BOUNDS}
          maxBoundsViscosity={1.0}
          minZoom={6}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <LocationPicker onLocationSelect={handleLocationSelect} />
          {selectedPoint && (
            <Marker position={[selectedPoint.lat, selectedPoint.lng]} />
          )}
        </MapContainer>

        {selectedPoint && (
          <div className="absolute bottom-6 left-4 right-4 z-[1000] bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100">
                <MapPin className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{mockLocationName}</h3>
                <p className="text-slate-500 text-sm font-mono mt-1">
                  {selectedPoint.lat.toFixed(4)}° N, {selectedPoint.lng.toFixed(4)}° E
                </p>
              </div>
            </div>
            
            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-bold shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-1 cursor-pointer"
            >
              {t.confirmPort}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
