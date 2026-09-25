export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading alerts"
      className="space-y-6 pb-20 pt-2 max-w-7xl mx-auto px-4 sm:px-6"
    >
      <div className="space-y-3 pb-2 border-b border-[#DAE5E0]">
        <div className="h-6 w-64 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 animate-pulse" />
        <div className="h-9 w-2/3 max-w-md rounded-xl bg-[#EAF1ED] animate-pulse" />
        <div className="h-4 w-1/2 max-w-sm rounded-lg bg-slate-100 animate-pulse" />
      </div>
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-[#DAE5E0] bg-white p-4 space-y-2">
            <div className="h-10 rounded-2xl bg-[#EAF1ED] animate-pulse" />
            <div className="h-10 rounded-2xl bg-slate-50 animate-pulse" />
            <div className="h-10 rounded-2xl bg-slate-50 animate-pulse" />
            <div className="h-10 rounded-2xl bg-slate-50 animate-pulse" />
          </div>
          <div className="rounded-3xl border border-[#DAE5E0] bg-white p-5 space-y-3">
            <div className="h-5 w-40 rounded-lg bg-[#EAF1ED] animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded-xl bg-[#F2F6F4] animate-pulse" />
              <div className="h-16 rounded-xl bg-[#F2F6F4] animate-pulse" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border border-[#DAE5E0] bg-white p-6 sm:p-8 space-y-4">
            <div className="h-7 w-72 rounded-lg bg-[#EAF1ED] animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="h-24 rounded-2xl bg-[#F2F6F4] animate-pulse" />
              <div className="h-24 rounded-2xl bg-[#F2F6F4] animate-pulse" />
              <div className="h-24 rounded-2xl bg-[#F2F6F4] animate-pulse" />
            </div>
            <div className="h-12 w-full rounded-full bg-[#12211E]/10 animate-pulse" />
          </div>
          <div className="rounded-3xl border border-[#DAE5E0] bg-white p-6 sm:p-8 space-y-4">
            <div className="h-7 w-60 rounded-lg bg-[#EAF1ED] animate-pulse" />
            <div className="h-20 rounded-2xl bg-[#F2F6F4]/60 animate-pulse" />
            <div className="h-32 rounded-2xl bg-slate-50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
