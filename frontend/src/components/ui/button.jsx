export function Button({
  children,
  className = "",
  variant = "default",
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default: "bg-black text-white hover:bg-black/90",
    outline: "border border-gray-300 bg-white hover:bg-gray-100",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.default} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}