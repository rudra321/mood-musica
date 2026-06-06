// A single rotating-circle spinner, sized + colored via className, so every
// loading state across the app looks identical.

export default function Spinner({ className = "h-5 w-5 border-black/20 border-t-black/70" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 ${className}`}
    />
  );
}
