"use client";

import React, { useState } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp, MUNICIPAL_PORTS } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { Modal } from "../../components/ui/Modal";
import { Fuel, MapPin, Users, Calendar, ChevronRight, Search, Plus, Trash2 } from "lucide-react";

export default function FuelPage() {
  const {
    userProfile,
    fuelPools,
    addFuelCommit,
    createFuelPool,
    deleteFuelPool,
    language,
    showToast,
  } = useApp();

  const { t } = useTranslation(language);

  // Navigation state between the two tabs shown in images
  const [activeTab, setActiveTab] = useState<"pools" | "tiers">("pools");

  // Selected pool state (defaults to the first pool or null)
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(
    fuelPools.length > 0 ? fuelPools[0].id : null
  );

  const [fuelCommitLiters, setFuelCommitLiters] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState("");

  // Create pool modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolTarget, setNewPoolTarget] = useState(4000);
  const [newPoolPort, setNewPoolPort] = useState(userProfile.port || "Batangas Pier 1");
  const [newPoolDiscount, setNewPoolDiscount] = useState(2.5);

  const activePool = fuelPools.find((p) => p.id === selectedPoolId) || fuelPools[0];

  const isPoolOwner = (pool: typeof fuelPools[0]) => {
    if (!pool) return false;
    if (pool.createdByPhone) {
      if (pool.createdByPhone === userProfile?.phone) return true;
      const p1 = pool.createdByPhone.replace(/\D/g, "");
      const p2 = (userProfile?.phone || "").replace(/\D/g, "");
      if (p1 && p2 && (p1.endsWith(p2.slice(-8)) || p2.endsWith(p1.slice(-8)))) {
        return true;
      }
    }
    // Fallback for initial default pool or items without phone
    if (pool.id === "pool1" || pool.createdByPhone === "0912 345 6789") {
      return true;
    }
    return false;
  };

  const handleLaunchPoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoolName) {
      showToast("Please enter a name for the fuel co-op pool.", "error");
      return;
    }

    createFuelPool({
      name: newPoolName,
      targetVolume: newPoolTarget,
      currentVolume: 100,
      discountPerLiter: newPoolDiscount,
      port: newPoolPort,
    });

    setIsCreateOpen(false);
    setNewPoolName("");
    setNewPoolTarget(4000);
    setNewPoolDiscount(2.5);
  };

  const handleCommitOrder = () => {
    if (!activePool) return;
    if (activePool.currentVolume >= activePool.targetVolume) {
      showToast("This fuel pool is already full! Target volume has been reached.", "error");
      return;
    }
    addFuelCommit(activePool.id, fuelCommitLiters);
    showToast("Successfully committed fuel volume!", "success");
  };

  // Helper calculation for tier-based discount savings
  const calculateTierDiscount = (volume: number) => {
    if (volume >= 6000) return 8.0;
    if (volume >= 4000) return 5.5;
    if (volume >= 2500) return 3.2;
    if (volume >= 1000) return 1.5;
    return 0.0;
  };

  const currentDiscount = activePool ? calculateTierDiscount(activePool.currentVolume) : 0;
  const estimatedSavings = fuelCommitLiters * currentDiscount;

  return (
    <AuthLayout>
      <div className="space-y-6 text-slate-800 font-sans">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">
                COOPERATIVE FUEL ORDER
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Pool municipal diesel orders to unlock bulk pricing discounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Port or Pool..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 text-xs font-semibold rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#10B981] shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>START POOL</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm gap-1">
            <button
              onClick={() => setActiveTab("pools")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${activeTab === "pools"
                ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30"
                : "text-gray-400 hover:text-gray-700"
                }`}
            >
              NEARBY FUEL POOLS
            </button>
            <button
              onClick={() => setActiveTab("tiers")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${activeTab === "tiers"
                ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30"
                : "text-gray-400 hover:text-gray-700"
                }`}
            >
              PRICE TIERS & QUOTATIONS
            </button>
          </div>
        </div>

        {/* TAB 1: NEARBY FUEL POOLS */}
        {activeTab === "pools" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Pool Listings */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-md">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                  BROWSE COOPERATIVE POOLS
                </span>
                <span className="text-[11px] font-extrabold text-[#10B981] uppercase flex items-center gap-1 cursor-pointer">
                  ↑↓ SORTED BY DISTANCE (ASCENDING)
                </span>
              </div>

              <div className="space-y-3">
                {fuelPools
                  .filter(
                    (p) =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.port.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((pool) => {
                    const isSelected = selectedPoolId === pool.id;
                    const personalCommit = pool.commits?.[userProfile.phone] || 0;
                    const isOwner = isPoolOwner(pool);
                    const percentage = Math.min(
                      100,
                      Math.round((pool.currentVolume / pool.targetVolume) * 100)
                    );

                    return (
                      <div
                        key={pool.id}
                        onClick={() => setSelectedPoolId(pool.id)}
                        className={`bg-white border-2 rounded-3xl p-5 transition cursor-pointer shadow-md relative ${isSelected
                          ? "border-[#10B981] ring-1 ring-[#10B981]/50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">
                                {pool.name}
                              </h3>
                              {pool.currentVolume >= pool.targetVolume ? (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-300">
                                  POOL FULL
                                </span>
                              ) : personalCommit > 0 && (
                                <span className="bg-[#10B981]/10 text-[#10B981] text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-[#10B981]/20">
                                  JOINED
                                </span>
                              )}
                              {isOwner && (
                                <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200">
                                  YOUR POOL
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#10B981]" /> {pool.port}
                              </span>
                              <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                                0.5 km away
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isOwner && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete "${pool.name}"?`)) {
                                    deleteFuelPool(pool.id);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-black uppercase shadow-2xs active:scale-95"
                                title="Delete your pool"
                              >
                                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Delete</span>
                              </button>
                            )}

                            <div className="text-right">
                              <span className="text-[10px] font-black text-gray-400 block uppercase">
                                DISCOUNT
                              </span>
                              <span className="text-sm font-black text-[#10B981]">
                                -₱{pool.discountPerLiter.toFixed(2)}/L
                              </span>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? "text-[#10B981] translate-x-1" : ""}`} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mt-4 pt-3 border-t border-gray-100">
                          <div>
                            Liters: <span className="font-black text-slate-800">{pool.currentVolume.toLocaleString()}L</span> / {pool.targetVolume.toLocaleString()}L ({percentage}% Filled)
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-gray-400" /> {pool.participants || 12} Users
                            </span>
                            <span className="flex items-center gap-1 text-gray-400">
                              <Calendar className="w-3.5 h-3.5" /> Ends: 2026-08-01T05:18:09.643Z
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Column: Active Pool Selection Sidebar */}
            {activePool && (
              <div className="lg:col-span-5 bg-white border-2 border-slate-900/10 rounded-3xl p-6 shadow-md space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                    ACTIVE POOL SELECTION
                  </span>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                    {activePool.name}
                  </h2>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">
                    Distributing Base: {activePool.port}
                  </p>
                </div>

                {/* Progress Visual */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-gray-600">Volume Discount Status</span>
                    <span className="text-[#10B981]">{activePool.currentVolume.toLocaleString()}L Committed</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200">
                    <div
                      className="bg-[#10B981] h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (activePool.currentVolume / activePool.targetVolume) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-extrabold text-gray-400">
                    <span>0 L</span>
                    <span>Target: {activePool.targetVolume.toLocaleString()} L</span>
                  </div>
                </div>

                {/* Bulk Savings Target Tiers Grid */}
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    BULK SAVINGS TARGET TIERS
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex justify-between items-center shadow-2xs">
                      <div>
                        <div className="font-black text-slate-800">Bronze Tier</div>
                        <div className="text-[10px] text-gray-400 font-bold">1,000 L</div>
                      </div>
                      <span className="font-black text-[#10B981]">-1.50/L</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex justify-between items-center shadow-2xs">
                      <div>
                        <div className="font-black text-slate-800">Silver Tier</div>
                        <div className="text-[10px] text-gray-400 font-bold">2,500 L</div>
                      </div>
                      <span className="font-black text-gray-400">-3.20/L</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex justify-between items-center shadow-2xs">
                      <div>
                        <div className="font-black text-slate-800">Gold Co-Op Tier</div>
                        <div className="text-[10px] text-gray-400 font-bold">4,000 L</div>
                      </div>
                      <span className="font-black text-gray-400">-5.50/L</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex justify-between items-center shadow-2xs">
                      <div>
                        <div className="font-black text-slate-800">Maximum Bulk Tier</div>
                        <div className="text-[10px] text-gray-400 font-bold">6,000 L</div>
                      </div>
                      <span className="font-black text-gray-400">-8.00/L</span>
                    </div>
                  </div>
                </div>

                {/* Liter Input Stepper */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    SELECT REQUESTED VOLUME (LITERS)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      disabled={activePool.currentVolume >= activePool.targetVolume}
                      onClick={() => setFuelCommitLiters(Math.max(50, fuelCommitLiters - 50))}
                      className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black py-3 rounded-2xl text-xs transition cursor-pointer"
                    >
                      -50L
                    </button>
                    <input
                      type="number"
                      disabled={activePool.currentVolume >= activePool.targetVolume}
                      value={fuelCommitLiters}
                      onChange={(e) => setFuelCommitLiters(Number(e.target.value))}
                      className="bg-slate-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-center font-black text-sm text-slate-900 focus:outline-none focus:border-[#10B981]"
                    />
                    <button
                      disabled={activePool.currentVolume >= activePool.targetVolume}
                      onClick={() => setFuelCommitLiters(fuelCommitLiters + 50)}
                      className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black py-3 rounded-2xl text-xs transition cursor-pointer"
                    >
                      +50L
                    </button>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-50/50 rounded-2xl p-4 space-y-2 border border-gray-100 text-xs font-bold">
                  <div className="flex justify-between text-gray-600">
                    <span>Liters Requested:</span>
                    <span className="font-black text-slate-900">{fuelCommitLiters} L</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Locked Discount Per Liter:</span>
                    <span className="font-black text-[#10B981]">-₱{currentDiscount.toFixed(2)}/L</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-black uppercase text-slate-900">ESTIMATED ORDER SAVINGS:</span>
                    <span className="font-black text-lg text-[#10B981]">
                      ₱{isNaN(estimatedSavings) ? "0.00" : estimatedSavings.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleCommitOrder}
                    disabled={activePool.currentVolume >= activePool.targetVolume}
                    className={`w-full font-black text-xs uppercase py-4 rounded-2xl transition shadow-sm ${
                      activePool.currentVolume >= activePool.targetVolume
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400/30"
                        : "bg-[#10B981] hover:bg-[#059669] text-white active:scale-98 cursor-pointer"
                    }`}
                  >
                    {activePool.currentVolume >= activePool.targetVolume
                      ? "POOL IS FULL (TARGET REACHED)"
                      : "JOIN BULK ORDER POOL"}
                  </button>

                  {isPoolOwner(activePool) && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${activePool.name}"?`)) {
                          deleteFuelPool(activePool.id);
                        }
                      }}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black text-xs uppercase py-3.5 rounded-2xl transition shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>DELETE THIS CO-OP POOL</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRICE TIERS & QUOTATIONS */}
        {activeTab === "tiers" && (
          <div className="max-w-5xl mx-auto my-6">
            <div className="bg-white border-2 border-slate-900/10 rounded-3xl p-8 shadow-sm">
              <div className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                  STANDARD PRICING MATRIX
                </span>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  CO-OP PRICE TIERS & QUOTATIONS
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Fuel prices decrease exponentially as the combined municipal volume grows towards bulk target levels.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Active Price Levels Stack */}
                <div className="lg:col-span-7 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    ACTIVE PRICE LEVELS
                  </span>

                  {/* Bronze Tier */}
                  <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between bg-white shadow-2xs hover:border-[#10B981] transition">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#10B981]/10 text-[#10B981] font-black text-xs flex items-center justify-center">
                        1
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-xs">BRONZE TIER</h4>
                        <span className="text-[10px] text-gray-400 font-bold">Min Pool Volume: 1,000 L</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">₱59.50/L</span>
                      <span className="text-[10px] font-extrabold text-[#10B981]">Save ₱1.50/L</span>
                    </div>
                  </div>

                  {/* Silver Tier */}
                  <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between bg-white shadow-2xs hover:border-[#10B981] transition">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#10B981]/10 text-[#10B981] font-black text-xs flex items-center justify-center">
                        2
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-xs">SILVER TIER</h4>
                        <span className="text-[10px] text-gray-400 font-bold">Min Pool Volume: 2,500 L</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">₱57.80/L</span>
                      <span className="text-[10px] font-extrabold text-[#10B981]">Save ₱3.20/L</span>
                    </div>
                  </div>

                  {/* Gold Co-Op Tier */}
                  <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between bg-white shadow-2xs hover:border-[#10B981] transition">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#10B981]/10 text-[#10B981] font-black text-xs flex items-center justify-center">
                        3
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-xs">GOLD CO-OP TIER</h4>
                        <span className="text-[10px] text-gray-400 font-bold">Min Pool Volume: 4,000 L</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">₱55.50/L</span>
                      <span className="text-[10px] font-extrabold text-[#10B981]">Save ₱5.50/L</span>
                    </div>
                  </div>

                  {/* Maximum Bulk Tier */}
                  <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between bg-white shadow-2xs hover:border-[#10B981] transition">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#10B981]/10 text-[#10B981] font-black text-xs flex items-center justify-center">
                        4
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-xs">MAXIMUM BULK TIER</h4>
                        <span className="text-[10px] text-gray-400 font-bold">Min Pool Volume: 6,000 L</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">₱53.00/L</span>
                      <span className="text-[10px] font-extrabold text-[#10B981]">Save ₱8.00/L</span>
                    </div>
                  </div>
                </div>

                {/* Right Info Box: Guidelines & Compliance */}
                <div className="lg:col-span-5 bg-[#F0FDF4] border border-[#10B981]/20 rounded-3xl p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#10B981] tracking-wider mb-4">
                      JOINT PURCHASE GUIDELINES
                    </h3>
                    <ul className="space-y-4 text-xs font-semibold text-gray-700">
                      <li className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#10B981] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          No advance deposits required. Place volume reservations securely using cellular SMS networks.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#10B981] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          Upon pool closing date, fuel tankers deliver directly to distribution shoreline bases.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#10B981] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          Each cooperative member receives their diesel allocation directly at the port and pays the final bulk-rate price.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#10B981]/20">
                    <h4 className="text-[10px] font-black uppercase text-[#10B981] tracking-wider mb-1">
                      PORT COMPLIANCE
                    </h4>
                    <p className="text-[11px] text-gray-600 font-medium">
                      Sourced from certified depots complying with BFAR sea fleet regulations.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Launch Pool Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Launch Co-op Fuel Pool"
        size="sm"
      >
        <form onSubmit={handleLaunchPoolSubmit} className="space-y-4 pt-1">
          {/* Cooperative Pool Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
              Cooperative Pool Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mercedes Fishermen Pool C"
              value={newPoolName}
              onChange={(e) => setNewPoolName(e.target.value)}
              className="w-full bg-slate-50 border border-[#10B981] text-slate-900 placeholder:text-slate-400 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            />
          </div>

          {/* Target Volume & Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                Target Volume (Liters)
              </label>
              <input
                type="number"
                required
                value={newPoolTarget}
                onChange={(e) => setNewPoolTarget(parseInt(e.target.value) || 4000)}
                className="w-full bg-slate-50 border border-[#10B981] text-slate-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                Discount (₱/Liter)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={newPoolDiscount}
                onChange={(e) => setNewPoolDiscount(parseFloat(e.target.value) || 2.5)}
                className="w-full bg-slate-50 border border-[#10B981] text-slate-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>
          </div>

          {/* Anchorage Port Base */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
              Anchorage Port Base
            </label>
            <select
              value={newPoolPort}
              onChange={(e) => setNewPoolPort(e.target.value)}
              className="w-full bg-slate-50 border border-[#10B981] text-slate-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            >
              {MUNICIPAL_PORTS.map((port) => (
                <option key={port.name} value={port.name} className="text-slate-900 bg-white">
                  {port.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition cursor-pointer shadow-sm"
            >
              Create Pool
            </button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  );
}