"use client";

import React, { useState } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp, MUNICIPAL_PORTS } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { TierProgressBar } from "../../components/ui/TierProgressBar";
import { Modal } from "../../components/ui/Modal";
import { DollarSign, Fuel, Gift, Info, Layers, Plus, Users } from "lucide-react";

export default function FuelPage() {
  const {
    userProfile,
    fuelPools,
    addFuelCommit,
    createFuelPool,
    language,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // States
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [fuelCommitLiters, setFuelCommitLiters] = useState(100);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New pool form fields
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolTarget, setNewPoolTarget] = useState(4000);
  const [newPoolPort, setNewPoolPort] = useState(userProfile.port);
  const [newPoolDiscount, setNewPoolDiscount] = useState(2.5);

  const activePool = fuelPools.find((p) => p.id === selectedPoolId);

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
    // Reset
    setNewPoolName("");
    setNewPoolTarget(4000);
    setNewPoolDiscount(2.5);
  };

  return (
    <AuthLayout>
      <div className="space-y-6 md:space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Cooperative Fuel Pool
            </span>
            <h2 className="font-display font-[900] text-3xl text-slate-900 dark:text-[#F7FAF9] mt-0.5 flex items-center gap-2">
              <Fuel className="w-7 h-7 text-[#10B981]" />
              Co-op Fuel Pools
            </h2>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#10B981] hover:bg-[#00B37E] text-white font-black text-xs uppercase tracking-widest px-6 h-11 rounded-2xl transition shadow flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Co-op Pool</span>
          </button>
        </div>

        {/* Informative program stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 p-6 rounded-[2rem] shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-[#10B981]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Total Participations
              </span>
              <span className="text-xl font-black text-[#12211E] dark:text-[#F7FAF9] block mt-0.5">
                42 Fishermen Active
              </span>
              <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                Across 14 coastal ports
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 p-6 rounded-[2rem] shadow-sm flex items-start gap-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-2xl text-[#10B981]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Total Bulk Volume
              </span>
              <span className="text-xl font-black text-[#12211E] dark:text-[#F7FAF9] block mt-0.5">
                9,700 Liters Committed
              </span>
              <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                Bulk pipeline discounts unlocked
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 p-6 rounded-[2rem] shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-amber-500">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Average Savings Rate
              </span>
              <span className="text-xl font-black text-[#12211E] dark:text-[#F7FAF9] block mt-0.5">
                ₱3.20 Off per Liter
              </span>
              <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                Aggregated fuel co-op tier multiplier
              </span>
            </div>
          </div>
        </div>

        {/* Pools list */}
        <div className="space-y-4">
          <h3 className="font-display font-black text-xl text-slate-900 dark:text-[#F7FAF9]">
            Active Co-op Listings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fuelPools.map((pool) => {
              const personalCommit = pool.commits[userProfile.phone] || 0;
              const hasJoined = personalCommit > 0;

              return (
                <div
                  key={pool.id}
                  className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col justify-between space-y-6 text-left"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-slate-50 dark:bg-teal-950/40 border-gray-150 text-gray-500">
                          📍 {pool.port}
                        </span>
                        <h4 className="font-display font-black text-xl text-slate-900 dark:text-white mt-1.5">
                          {pool.name}
                        </h4>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs font-black text-brand-green block">
                          Current Tier Discount
                        </span>
                        <span className="text-2xl font-[900] text-brand-green">
                          -₱{pool.discountPerLiter.toFixed(2)}/L
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 font-bold leading-normal">
                      Municipal bulk cooperative pooling closes soon. Commit liters to unlock next discount tier levels!
                    </p>
                  </div>

                  {/* Progressive Bar Visualizer */}
                  <div className="border-t border-b border-gray-50 dark:border-teal-950/50 py-4">
                    <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                      <span>Volume Unlocked: {pool.currentVolume.toLocaleString()}L / {pool.targetVolume.toLocaleString()}L</span>
                      <span className="text-brand-green font-black">Target Goal</span>
                    </div>
                    
                    <TierProgressBar
                      currentVolume={pool.currentVolume}
                      targetVolume={pool.targetVolume}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-gray-400">
                        Participants: <span className="text-gray-800 dark:text-white font-extrabold">{pool.participants}</span>
                      </div>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <div className="text-xs font-bold text-gray-400">
                        Status: <span className="text-brand-green font-black uppercase">Open</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasJoined && (
                        <span className="text-[10px] font-black uppercase text-brand-green bg-brand-green/10 dark:bg-brand-green/20 px-2.5 py-1 rounded-full border border-brand-green/20">
                          My order: {personalCommit}L
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setSelectedPoolId(pool.id);
                          setFuelCommitLiters(hasJoined ? personalCommit : 100);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                          hasJoined
                            ? "bg-slate-100 hover:bg-slate-200 text-gray-700 dark:bg-zinc-800 dark:text-white"
                            : "bg-brand-green hover:bg-brand-green/90 text-white shadow-sm"
                        }`}
                      >
                        {hasJoined ? "Edit Liters" : "Commit Liters"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fuel Commit Modal */}
      <Modal
        isOpen={selectedPoolId !== null}
        onClose={() => setSelectedPoolId(null)}
        title={activePool ? `Commit order: ${activePool.name}` : "Join Co-op"}
        size="sm"
      >
        {activePool && (
          <div className="space-y-6">
            <div className="bg-brand-green/10 dark:bg-brand-green/20 border border-brand-green/20 p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Co-op Target:</span>
                <span className="text-brand-green font-black">{activePool.targetVolume.toLocaleString()} Liters</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500 mt-1">
                <span>Current Volume:</span>
                <span className="text-brand-green font-black">{activePool.currentVolume.toLocaleString()} Liters</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Enter Liters to Commit
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={50}
                  max={2000}
                  value={fuelCommitLiters}
                  onChange={(e) => setFuelCommitLiters(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-teal-950/20 border-2 border-slate-200 dark:border-teal-900 rounded-2xl h-12 px-4 text-sm font-semibold focus:outline-none focus:border-brand-green"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-brand-green">
                  Liters
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold">
                * Commitments can be adjusted before the closing date. Estimated discount is based on volume tier achieve metrics.
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setSelectedPoolId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  addFuelCommit(activePool.id, fuelCommitLiters);
                  setSelectedPoolId(null);
                }}
                className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition"
              >
                Confirm Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Launch Pool Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Launch Co-op Fuel Pool"
        size="sm"
      >
        <form onSubmit={handleLaunchPoolSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              Cooperative Pool Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mercedes Fishermen Pool C"
              value={newPoolName}
              onChange={(e) => setNewPoolName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-teal-950/20 border border-slate-200 dark:border-teal-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Target Volume (Liters)
              </label>
              <input
                type="number"
                required
                value={newPoolTarget}
                onChange={(e) => setNewPoolTarget(parseInt(e.target.value) || 4000)}
                className="w-full bg-slate-50 dark:bg-teal-950/20 border border-slate-200 dark:border-teal-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Discount (₱/Liter)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={newPoolDiscount}
                onChange={(e) => setNewPoolDiscount(parseFloat(e.target.value) || 2.5)}
                className="w-full bg-slate-50 dark:bg-teal-950/20 border border-slate-200 dark:border-teal-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              Anchorage Port Base
            </label>
            <select
              value={newPoolPort}
              onChange={(e) => setNewPoolPort(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#12211E] border border-slate-200 dark:border-teal-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none text-gray-800 dark:text-gray-200"
            >
              {MUNICIPAL_PORTS.map((port) => (
                <option key={port.name} value={port.name}>
                  {port.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition"
            >
              Create Pool
            </button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  );
}
