import React, { useState } from 'react';
import { Droplets, CheckCircle, Plus, Calendar, Users, MapPin, Info, X } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { calculateDistance } from '../utils/geoUtils';

export const FuelOrderingView: React.FC = () => {
  const { fuelPools, referencePoint, addToPool, createNewPool, currentJoinedPoolId } = useAppState();

  const [activeTab, setActiveTab] = useState<'pools' | 'rules'>('pools');
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [inputVolume, setInputVolume] = useState<string>('');
  const [ordered, setOrdered] = useState(false);

  // New pool modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolPort, setNewPoolPort] = useState('');
  const [newPoolTarget, setNewPoolTarget] = useState('2000');
  const [newPoolStartVol, setNewPoolStartVol] = useState('150');
  const [newPoolDate, setNewPoolDate] = useState('');

  if (!referencePoint) return null;

  // Proximity sorting and details: calculate distances and include them
  const poolsWithDistance = fuelPools.map(pool => {
    const dist = calculateDistance(referencePoint.lat, referencePoint.lng, pool.lat, pool.lng);
    return { ...pool, distance: dist };
  }).sort((a, b) => a.distance - b.distance);

  const selectedPool = fuelPools.find(p => p.id === (selectedPoolId || poolsWithDistance[0]?.id)) || poolsWithDistance[0];

  const handleJoinOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(inputVolume, 10);
    if (!isNaN(amount) && amount > 0 && selectedPool) {
      addToPool(selectedPool.id, amount);
      setOrdered(true);
      setInputVolume('');
      setTimeout(() => setOrdered(false), 3000);
    }
  };

  const handleCreatePool = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseInt(newPoolTarget, 10);
    const startVal = parseInt(newPoolStartVol, 10);
    
    if (newPoolName && newPoolPort && !isNaN(targetVal) && !isNaN(startVal)) {
      createNewPool({
        name: newPoolName,
        lat: referencePoint.lat + (Math.random() - 0.5) * 0.05, // slightly offset near reference
        lng: referencePoint.lng + (Math.random() - 0.5) * 0.05,
        currentVolume: startVal,
        targetVolume: targetVal,
        lastDiscount: '₱0.00',
        distributionPoint: newPoolPort,
        activeParticipants: 1,
        targetDate: newPoolDate || 'July 30, 2026'
      });
      setIsModalOpen(false);
      setNewPoolName('');
      setNewPoolPort('');
      setNewPoolDate('');
      setNewPoolStartVol('150');
      // Highlight the newly created pool
      setOrdered(true);
      setTimeout(() => setOrdered(false), 2000);
    }
  };

  // Helper for pricing scale visual feedback
  const getTier = (volume: number) => {
    if (volume < 1000) return { name: 'Tier 1', discount: 'Est. -₱0.00', min: 0, max: 1000, color: 'bg-slate-300', text: 'text-slate-600' };
    if (volume < 2500) return { name: 'Tier 2 (Bronze)', discount: 'Est. -₱2.00', min: 1000, max: 2500, color: 'bg-amber-600', text: 'text-amber-700' };
    if (volume < 5000) return { name: 'Tier 3 (Silver)', discount: 'Est. -₱4.00', min: 2500, max: 5000, color: 'bg-slate-400', text: 'text-slate-700' };
    return { name: 'Tier 4 (Gold)', discount: 'Est. -₱6.00', min: 5000, max: 10000, color: 'bg-yellow-500', text: 'text-yellow-700' };
  };

  const activeTier = selectedPool ? getTier(selectedPool.currentVolume) : getTier(0);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:p-8 flex flex-col items-center pb-24 overflow-y-auto">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Droplets className="w-6 h-6 text-teal-600" />
              <span>Bulk Fuel Pools</span>
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Pool bulk fuel volumes together to negotiate wholesale price cuts.</p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-sm shadow-md shadow-teal-600/10 hover:shadow-lg transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Start a New Pool</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/60 p-1 rounded-full max-w-sm">
          <button
            onClick={() => setActiveTab('pools')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'pools' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Nearby Fuel Pools
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'rules' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Price Tiers & Quotations
          </button>
        </div>

        {activeTab === 'pools' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column - Nearby Pools list (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Proximity Pools Sorted by Distance</span>
              
              {poolsWithDistance.map(pool => {
                const isJoined = currentJoinedPoolId === pool.id;
                const poolTier = getTier(pool.currentVolume);
                
                return (
                  <div
                    key={pool.id}
                    onClick={() => setSelectedPoolId(pool.id)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs ${
                      selectedPoolId === pool.id 
                        ? 'bg-white border-teal-500 ring-2 ring-teal-50/70' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-base">{pool.name}</h4>
                          {isJoined && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Joined</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{pool.distributionPoint} • <span className="font-mono text-teal-600 font-semibold">{pool.distance.toFixed(1)} km away</span></span>
                        </p>
                      </div>
                      
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${poolTier.color} ${poolTier.text}`}>
                        {poolTier.discount} OFF/L
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Volume</span>
                        <span className="text-slate-800 text-sm font-bold mt-0.5">{pool.currentVolume.toLocaleString()} L</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Participants</span>
                        <span className="text-slate-800 text-sm font-bold mt-0.5 flex items-center justify-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {pool.activeParticipants}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Closes</span>
                        <span className="text-slate-800 text-xs font-bold mt-0.5 truncate flex items-center justify-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {pool.targetDate}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column - Active Selected Pool Join Form (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              {selectedPool && (
                <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">Join Bulk Pool</h3>
                    <p className="text-slate-800 font-bold text-lg mt-1">{selectedPool.name}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{selectedPool.distributionPoint}</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Base Pricing Structure</span>
                      <span className="font-bold text-slate-800">Pending Local Station Offer</span>
                    </div>
                    <p className="text-sm font-black text-teal-600">
                      Base Price: Pending Pool Close & Local Station Quotation
                    </p>
                  </div>

                  <form onSubmit={handleJoinOrder} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Liters Requested</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          required
                          value={inputVolume}
                          onChange={(e) => setInputVolume(e.target.value)}
                          placeholder="e.g. 200"
                          className="w-full px-5 py-3 rounded-full border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono shadow-xs text-base"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">LITERS</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!inputVolume || parseInt(inputVolume, 10) <= 0}
                      className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full font-bold text-sm shadow-md shadow-teal-600/10 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {ordered ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-white" />
                          <span>Joined Pool Successfully</span>
                        </>
                      ) : (
                        <span>Join Bulk Order Pool</span>
                      )}
                    </button>
                  </form>

                  {/* Volume-discount live tier indicator */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Estimated Discount Tier:</span>
                      <span className={`font-bold ${activeTier.text}`}>{activeTier.name} (-{activeTier.discount})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (selectedPool.currentVolume / selectedPool.targetVolume) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      Progress: {selectedPool.currentVolume.toLocaleString()}L of {selectedPool.targetVolume.toLocaleString()}L Target reached.
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
            <div>
              <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4.5 h-4.5" /> Price Scale Details & Disclaimers
              </h3>
              <p className="text-slate-500 text-xs">How co-op fuel volume cuts rates at local partner stations.</p>
            </div>

            {/* Base Quote Indicator */}
            <div className="p-5 bg-teal-50 border border-teal-100 rounded-2xl">
              <h4 className="text-sm font-bold text-teal-900 uppercase tracking-wide">Base Price Principle</h4>
              <p className="text-lg font-black text-teal-700 mt-1">Pending Pool Close & Local Station Quotation</p>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                Because wholesale rates fluctuate daily and depend on our collective volume, the final price per liter will be negotiated and locked by the local fuel station only after this pool closes. Parola coordinates directly with stations in Mercedes, Estancia, and Navotas.
              </p>
            </div>

            {/* Visual scale scale representing discount milestones */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Volume Discount Scale</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { title: 'Tier 1', volume: 'Under 1,000L', discount: 'Est. -₱0.00/L', desc: 'Quota Not Met. Fuel stations charge standard local pumps.', color: 'border-slate-200' },
                  { title: 'Tier 2 (Bronze)', volume: '1,000L - 2,500L', discount: 'Est. -₱2.00/L', desc: 'Slight leverage discount. Cuts local retail rates.', color: 'border-amber-200 bg-amber-50/20' },
                  { title: 'Tier 3 (Silver)', volume: '2,500L - 5,000L', discount: 'Est. -₱4.00/L', desc: 'Significant wholesale discount for coastal vessels.', color: 'border-slate-300 bg-slate-50/50' },
                  { title: 'Tier 4 (Gold)', volume: 'Over 5,000L', discount: 'Est. -₱6.00/L', desc: 'Premium wholesale rate. Maximum discount locked.', color: 'border-yellow-200 bg-yellow-50/20' }
                ].map((tier, idx) => (
                  <div key={idx} className={`p-4 border rounded-2xl flex flex-col justify-between ${tier.color}`}>
                    <div>
                      <span className="text-xs font-black text-slate-800">{tier.title}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{tier.volume}</p>
                    </div>
                    <div className="my-4">
                      <span className="text-xl font-black text-teal-600">{tier.discount}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{tier.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Important:</strong> Active users are notified via SMS immediately upon quotation locks with the target pickup station and transaction hash codes. All pickups require verified Parola mobile credentials.
              </p>
            </div>
          </section>
        )}

      </div>

      {/* Start New Pool Rounded Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 transform scale-100 transition-all flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-lg">Start a New Fuel Pool</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePool} className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Co-op Name</label>
                <input
                  type="text"
                  required
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  placeholder="e.g. Mercedes East Association"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distribution Port / Barangay</label>
                <input
                  type="text"
                  required
                  value={newPoolPort}
                  onChange={(e) => setNewPoolPort(e.target.value)}
                  placeholder="e.g. Barangay San Roque Pier"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Starting Volume (L)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPoolStartVol}
                    onChange={(e) => setNewPoolStartVol(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Volume (L)</label>
                  <input
                    type="number"
                    min="500"
                    required
                    value={newPoolTarget}
                    onChange={(e) => setNewPoolTarget(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distribution Target Date</label>
                <input
                  type="text"
                  required
                  value={newPoolDate}
                  onChange={(e) => setNewPoolDate(e.target.value)}
                  placeholder="e.g. July 29, 2026"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-xs"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-full font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-xs shadow-md shadow-teal-600/10 hover:shadow-lg transition-all"
                >
                  Initiate Pool
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
