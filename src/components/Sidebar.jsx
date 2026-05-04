import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MessageSquare,
  ChefHat,
  Users,
} from "lucide-react";

export default function Sidebar({ activePage, setActivePage }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Commandes", icon: ShoppingCart },
    { id: "kitchen", label: "Cuisine", icon: ChefHat },
    { id: "stock", label: "Stock", icon: Package },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "customers", label: "Clients", icon: Users },
  ];

  return (
    <div className="h-full w-72 border-r border-white/10 bg-[#020617] p-5 shadow-2xl">
      <h1 className="mb-10 text-2xl font-black">🥪 Admin</h1>

      <nav className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition ${
                active
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}