const activities = [
  {
    action: "New user registered",
    user: "Rahul Das",
    time: "5 minutes ago",
  },
  {
    action: "Transaction added",
    user: "Priya Sharma",
    time: "18 minutes ago",
  },
  {
    action: "Budget updated",
    user: "Aman Singh",
    time: "42 minutes ago",
  },
  {
    action: "User profile updated",
    user: "Neha Roy",
    time: "1 hour ago",
  },
];

const ActivityLog = () => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold">System Activity</h2>

        <p className="mt-1 text-xs text-slate-400">Latest system events</p>
      </div>

      <div className="space-y-5">
        {activities.map((activity) => (
          <div key={`${activity.user}-${activity.time}`} className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />

            <div>
              <p className="text-sm font-medium">{activity.action}</p>

              <p className="text-xs text-slate-400">
                {activity.user} · {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
