export default function Modal({ title, onClose, wide = false, children }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        className={`card surface-glow relative w-full p-6 ${wide ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-paper">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-muted transition hover:bg-panel-2 hover:text-paper"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
