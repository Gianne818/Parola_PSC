import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, MapPin, Globe, Phone, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useAppState } from '../context/AppStateContext';
import 'leaflet/dist/leaflet.css';

export const ProfileView: React.FC = () => {
  const { user, language, setLanguage, referencePoint, setReferencePoint } = useAppState();
  const navigate = useNavigate();

  if (!user) return null;

  const handleResetLocation = () => {
    setReferencePoint(null);
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pb-24 overflow-y-auto">
      <div className="w-full max-w-md mt-6 space-y-6">
        
        {/* User Card */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-teal-600 rounded-full flex items-center justify-center shadow-xl shadow-teal-500/20 mb-4 border-4 border-white">
            <UserCircle className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
          <p className="text-teal-600 text-sm font-medium">Verified Fisherman</p>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Personal Info</h3>
          
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
              <Phone className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone Number</p>
              <p className="text-slate-900 font-medium font-mono">{user.phoneNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
              <Globe className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Preferred Language</p>
              <p className="text-slate-900 font-medium uppercase">{language}</p>
            </div>
          </div>

          {/* Language Preference Swapping UI */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select UI Language</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: 'en', label: 'English' },
                { code: 'tl', label: 'Tagalog' },
                { code: 'ceb', label: 'Cebuano' },
                { code: 'hil', label: 'Hiligaynon' }
              ].map((langObj) => (
                <button
                  key={langObj.code}
                  onClick={() => setLanguage(langObj.code as any)}
                  className={`py-2 px-3 rounded-full text-xs font-bold transition-all border text-center ${
                    language === langObj.code
                      ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {langObj.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Saved Location Visualized */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Saved Location</h3>
          
          {referencePoint ? (
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100">
                  <MapPin className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{referencePoint.locationName}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    {referencePoint.lat.toFixed(4)}° N, {referencePoint.lng.toFixed(4)}° E
                  </p>
                </div>
              </div>

              {/* Mini Static Leaflet Map */}
              <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0">
                <MapContainer
                  center={[referencePoint.lat, referencePoint.lng]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                  zoomControl={false}
                  dragging={false}
                  doubleClickZoom={false}
                  boxZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <Marker position={[referencePoint.lat, referencePoint.lng]} />
                </MapContainer>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No location set.</p>
          )}

          <button
            onClick={handleResetLocation}
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-bold transition-all flex justify-center items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Reset Reference Point
          </button>
        </div>

      </div>
    </div>
  );
};
