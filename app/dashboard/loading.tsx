export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading dashboard"
      className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-5 items-stretch h-full w-full p-4 lg:p-5 min-h-0 bg-white"
    >
      <div className="flex-1 w-full min-w-0 flex flex-col gap-4 h-full">
        <div className="h-9 w-56 mx-auto rounded-full bg-[#EAF1ED] animate-pulse" />
        <div className="w-full flex-1 min-h-[420px] rounded-3xl border border-[#DAE5E0] bg-[#F2F6F4] animate-pulse" />
      </div>
      <div className="w-full lg:w-[600px] shrink-0 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="h-6 w-48 rounded-lg bg-[#EAF1ED] animate-pulse" />
        <div className="h-24 rounded-2xl border border-gray-200 bg-slate-50/80 animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-16 rounded-2xl bg-emerald-50/60 border border-emerald-100 animate-pulse" />
          <div className="h-16 rounded-2xl bg-slate-50 border border-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
