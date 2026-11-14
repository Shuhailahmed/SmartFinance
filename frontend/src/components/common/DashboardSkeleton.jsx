const DashboardSkeleton = () => {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 rounded-2xl bg-slate-200" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-[380px] rounded-2xl bg-slate-200 xl:col-span-2" />

        <div className="h-[380px] rounded-2xl bg-slate-200" />
      </div>

      <div className="h-72 rounded-2xl bg-slate-200" />
    </div>
  );
};

export default DashboardSkeleton;
