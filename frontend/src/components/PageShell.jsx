import Header from "./Header";

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
