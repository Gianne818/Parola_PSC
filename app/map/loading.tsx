export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Redirecting to dashboard"
      className="min-h-[60vh] flex items-center justify-center bg-white p-6"
    >
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="h-6 w-48 mx-auto rounded-full bg-[#EAF1ED] animate-pulse" />
        <div className="h-40 rounded-3xl border border-[#DAE5E0] bg-[#F2F6F4] animate-pulse" />
        <p className="text-xs font-bold uppercase tracking-wider text-[#12211E]/60">
          Redirecting to dashboard…
        </p>
      </div>
    </div>
  );
}
