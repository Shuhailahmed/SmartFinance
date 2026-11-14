function InsightCard({ title, value, description }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>

      {value && <p className="mt-2 text-2xl font-bold">{value}</p>}

      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

export default InsightCard;
