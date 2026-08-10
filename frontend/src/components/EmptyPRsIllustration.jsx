export default function EmptyPRsIllustration({ className = "h-28 w-28" }) {
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="80" r="78" fill="#1A2029" />
      <circle cx="80" cy="80" r="78" stroke="#2D3346" strokeWidth="1" />

      <circle cx="30" cy="46" r="3" fill="#2D3346" />
      <circle cx="132" cy="112" r="3" fill="#2D3346" />
      <circle cx="126" cy="38" r="2.5" fill="#6C63FF" opacity="0.5" />
      <circle cx="28" cy="118" r="2.5" fill="#2FE6A5" opacity="0.5" />

      <rect x="42" y="60" width="76" height="56" rx="10" fill="#141922" stroke="#2D3346" strokeWidth="2" />
      <rect x="42" y="60" width="76" height="18" rx="10" fill="#1A2029" stroke="#2D3346" strokeWidth="2" />
      <circle cx="53" cy="69" r="2.5" fill="#6C63FF" opacity="0.7" />
      <circle cx="61" cy="69" r="2.5" fill="#2D3346" />

      <rect x="52" y="90" width="40" height="4" rx="2" fill="#2D3346" />
      <rect x="52" y="99" width="26" height="4" rx="2" fill="#2D3346" />

      <g transform="translate(88 30)">
        <circle cx="20" cy="20" r="20" fill="#6C63FF" />
        <path d="M20 12v16M12 20h16" stroke="#F4F5F7" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
