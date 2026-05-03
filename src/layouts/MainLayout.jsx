import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, activePage, setActivePage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleChangePage(page) {
    setActivePage(page);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Topbar mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#020617]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥪</span>
          <span className="font-black">Admin</span>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-white"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 z-50 h-full w-72 transform transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="relative h-full">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-white md:hidden"
            >
              <X size={20} />
            </button>

            <Sidebar
              activePage={activePage}
              setActivePage={handleChangePage}
            />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}