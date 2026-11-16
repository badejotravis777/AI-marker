// Small line icons drawn with SVG so the app needs no icon library.
const PATHS = {
  camera: "M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  gallery: "M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15.5 9.5a1.5 1.5 0 1 0 0-.01",
  results: "M5 6h14 M5 12h14 M5 18h9",
  guide: "M4 20h4L19 9l-4-4L4 16z M13 7l4 4",
  impact: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 3",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 4l9 16H3z M12 10v4 M12 17v.01",
  print: "M7 9V4h10v5 M5 9h14v7h-3v4H8v-4H5z M8 16h8",
  download: "M12 4v11 M7 10l5 5 5-5 M5 20h14",
  trash: "M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12 M18 6L6 18",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7 M20 5v6h-6",
};

export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
