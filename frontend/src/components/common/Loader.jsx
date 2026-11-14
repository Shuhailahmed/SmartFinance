const Loader = ({ size = "md", text = "Loading..." }) => {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };

  const spinnerSize = sizes[size] || sizes.md;

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-6"
      role="status"
      aria-live="polite"
    >
      <div
        className={`${spinnerSize} animate-spin rounded-full border-emerald-100 border-t-emerald-600`}
        aria-hidden="true"
      />
      {text && <p className="text-sm font-medium text-slate-500">{text}</p>}
      <span className="sr-only">Loading content</span>
    </div>
  );
};

export default Loader;
