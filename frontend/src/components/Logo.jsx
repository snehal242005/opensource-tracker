import { useId } from "react";

/**
 * OpenSource Hub mark: a contribution-graph line trending upward with an
 * arrow tip (growth/progress) and a commit node on the climb (code/PRs).
 */
export default function Logo({ className = "h-8 w-8" }) {
  const gradientId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="OpenSource Hub"
    >
      <rect width="24" height="24" rx="6" fill={`url(#${gradientId})`} />
      <path
        d="M4.5 17.5 9 12.5 12.25 15.5 19 8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.75 7.5H19V11.75"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12.5" r="1.3" fill="#fff" />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6C63FF" />
          <stop offset="1" stopColor="#B490FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
