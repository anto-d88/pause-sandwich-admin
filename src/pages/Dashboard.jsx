import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  MessageSquare,
  Package,
  ShoppingCart,
  Users,
  Sparkles,
  Wifi,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import KpiCard from "../components/KpiCard";
import RevenueChart from "../components/RevenueChart";
import OrdersSlotChart from "../components/OrdersSlotChart";
import TopProductsChart from "../components/TopProductsChart";
import StockManager from "../components/StockManager";
import NewOrderAlert from "../components/NewOrderAlert";
import { getDashboardData } from "../services/dashboardService";
import { supabase } from "../services/supabase";

const formatMoney = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);

function playNewOrderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);

    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.35);
  } catch (error) {
    console.warn("Son notification bloqué par le navigateur.", error);
  }
}

export default function Dashboard({ activePage, setActivePage }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState({
    visible: false,
    order: null,
  });

  const firstLoadDone = useRef(false);

  async function loadDashboard() {
    try {
      setRefreshing(true);
      const data = await getDashboardData();
      setDashboard(data);
      setError("");
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données Supabase.");
    } finally {
      setRefreshing(false);
    }
  }

function handleNewOrder(order) {
  if (!firstLoadDone.current) return;

  if (soundEnabled) {
    playNewOrderSound();
  }

  setNewOrderAlert({
    visible: true,
    order,
  });

  setTimeout(() => {
    setNewOrderAlert((current) => ({
      ...current,
      visible: false,
    }));
  }, 10000);
}

  useEffect(() => {
    async function initialLoad() {
      await loadDashboard();
      firstLoadDone.current = true;
    }

    initialLoad();

    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          handleNewOrder(payload.new);
          loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe((status) => {
        console.log("Realtime status :", status);
      });

    const fallbackRefresh = setInterval(() => {
      loadDashboard();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackRefresh);
    };
  }, []);

  if (error) {
    return (
      <MainLayout activePage={activePage} setActivePage={setActivePage}>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          {error}
        </div>
      </MainLayout>
    );
  }

  if (!dashboard) {
    return (
<MainLayout activePage={activePage} setActivePage={setActivePage}>
        <p className="text-slate-400">Chargement des données...</p>
      </MainLayout>
    );
  }

  const { kpis, charts, lists } = dashboard;

  return (
<MainLayout activePage={activePage} setActivePage={setActivePage}>
      <NewOrderAlert
        visible={newOrderAlert.visible}
        order={newOrderAlert.order}
        onClose={() =>
          setNewOrderAlert({
            visible: false,
            order: null,
          })
        }
      />

<div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  <div>
    <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
      LA PAUSE SANDWICH
    </p>
    <h1 className="mt-2 text-3xl font-black text-white">
      Dashboard admin
    </h1>
    <p className="mt-2 text-slate-400">
      Vue complète des ventes, commandes, messages et stocks.
    </p>
  </div>

  <div className="flex gap-3">
    <button
      onClick={() => {
        setSoundEnabled(true);
        playNewOrderSound();
      }}
      className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
    >
      🔊 Activer le son
    </button>

    <button
      onClick={loadDashboard}
      disabled={refreshing}
      className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
    >
      <Sparkles size={18} />
      {refreshing ? "Actualisation..." : "Actualiser"}
    </button>
  </div>
</div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="CA du jour" value={formatMoney(kpis.todayRevenue)} icon={Banknote} tone="green" />
        <KpiCard title="CA total" value={formatMoney(kpis.totalRevenue)} icon={Banknote} tone="blue" />
        <KpiCard title="Commandes du jour" value={kpis.todayOrders} icon={ShoppingCart} tone="purple" />
        <KpiCard title="Panier moyen" value={formatMoney(kpis.averageBasket)} icon={ShoppingCart} tone="orange" />
        <KpiCard title="Menus / formules" value={kpis.formulasCount} icon={Package} tone="blue" />
        <KpiCard title="Commandes équipe" value={kpis.teamOrdersCount} icon={Users} tone="purple" />
        <KpiCard title="Messages non traités" value={kpis.untreatedMessages} icon={MessageSquare} tone="orange" />
        <KpiCard title="Stock critique" value={kpis.criticalStock} icon={AlertTriangle} tone="red" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <RevenueChart data={charts.revenueByDay} />
        <OrdersSlotChart data={charts.ordersBySlot} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <TopProductsChart data={charts.topProducts} />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold">Stock critique</h2>

          <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
            {lists.criticalStock.length === 0 ? (
              <p className="text-slate-400">Aucun stock critique.</p>
            ) : (
              lists.criticalStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-3"
                >
                  <div>
                    <p className="font-semibold">{product.display_name}</p>
                    <p className="text-sm text-slate-400">
                      {product.display_category}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-200">
                    Stock : {product.display_stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <StockManager products={lists.products} onStockUpdated={loadDashboard} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
       <h2 className="mb-4 text-lg font-semibold">Dernières commandes</h2>

<div className="overflow-x-auto">
  <table className="w-full min-w-[1000px] text-left text-sm">
    <thead className="text-slate-400">
      <tr>
        <th className="p-3">Type</th>
        <th className="p-3">Client</th>
        <th className="p-3">Téléphone</th>
        <th className="p-3">Entreprise</th>
        <th className="p-3">Adresse</th>
        <th className="p-3">Créneau</th>
        <th className="p-3">Statut</th>
        <th className="p-3">Total</th>
      </tr>
    </thead>

    <tbody>
      {lists.orders.length === 0 ? (
        <tr className="border-t border-white/10">
          <td className="p-3 text-slate-400" colSpan="8">
            Aucune commande pour le moment.
          </td>
        </tr>
      ) : (
        lists.orders.map((order) => {
          const isTeam = order.dashboard_order_type === "team";

          const client =
            order.customer_name ||
            order.contact_name ||
            order.name ||
            "-";

          const phone =
            order.customer_phone ||
            order.contact_phone ||
            order.phone ||
            "-";

          const company =
            order.company_name ||
            order.company ||
            order.enterprise_name ||
            "-";

          const address =
            order.delivery_address ||
            order.address ||
            "-";

          const slot =
            order.delivery_slot ||
            order.slot ||
            order.delivery_time ||
            "-";

          const total =
            order.dashboard_total ??
            order.total_amount ??
            order.total_price ??
            order.total ??
            0;

          return (
            <tr key={`${order.dashboard_order_type}-${order.id}`} className="border-t border-white/10">
              <td className="p-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isTeam
                      ? "bg-purple-500/20 text-purple-200"
                      : "bg-cyan-500/20 text-cyan-200"
                  }`}
                >
                  {isTeam ? "Équipe" : "Indiv."}
                </span>
              </td>

              <td className="p-3 font-semibold">{client}</td>
              <td className="p-3">{phone}</td>
              <td className="p-3">{company}</td>
              <td className="p-3">{address}</td>
              <td className="p-3">{slot}</td>

              <td className="p-3">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">
                  {order.status || "nouvelle"}
                </span>
              </td>

              <td className="p-3 font-semibold">
                {formatMoney(total)}
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>
      </div>
    </MainLayout>
  );
}