import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, activePage, setActivePage }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 overflow-x-hidden p-6">
        {children}
      </main>
    </div>
  );
}