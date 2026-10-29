import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Search, FolderOpen } from "lucide-react";
import { getLastCaseId } from "../utils/storage";

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  const last = getLastCaseId();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-ink-950">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Main">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-gold text-gold"><Search className="h-4 w-4" aria-hidden /></span>
            AI Mystery Room
          </Link>
          <div className="flex items-center gap-2">
            {last && pathname !== "/case/" + last && (
              <Link to={"/case/" + last} className="btn btn-ghost !py-1.5"><FolderOpen className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">Return to investigation</span><span className="sm:hidden">Resume</span></Link>
            )}
            <NavLink to="/create" className="btn btn-gold !py-1.5">New case</NavLink>
          </div>
        </nav>
      </header>
      <main id="main" className="flex-1"><Outlet /></main>
      <footer className="border-t border-ink-700 bg-ink-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>AI Mystery Room. Every case is generated fresh by Gemini and checked by the server before you see it.</p>
          <ul className="flex gap-4">
            <li><Link className="hover:text-gold" to="/">Home</Link></li>
            <li><Link className="hover:text-gold" to="/create">New case</Link></li>
            <li><a className="hover:text-gold" href="/#how">How it works</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
