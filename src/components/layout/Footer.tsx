import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-[#1a1a18] text-white/60 mt-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-xs">© 2026 ReportRx</p>
        <nav aria-label="Footer" className="flex items-center gap-4 text-xs">
          <Link to="/about" className="hover:text-white/90 transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-white/90 transition-colors">Privacy & Terms</Link>
          <Link to="/zeno" className="hover:text-white/90 transition-colors">Zeno AI</Link>
        </nav>
        <p className="text-[11px] text-white/40 max-w-md">
          For informational purposes only. Not a substitute for professional medical advice.
        </p>
      </div>
    </footer>
  );
}
