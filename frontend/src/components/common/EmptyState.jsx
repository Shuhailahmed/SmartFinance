import { FileSearch } from "lucide-react";
import Button from "./Button";

const EmptyState = ({
  icon: Icon = FileSearch,
  title = "Nothing here yet",
  description = "There is no data to display right now.",
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Icon size={30} strokeWidth={1.7} />
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
