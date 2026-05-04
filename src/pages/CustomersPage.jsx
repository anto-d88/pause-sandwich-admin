import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { supabase } from "../services/supabase";
import { Users, Phone, TrendingUp, Clock } from "lucide-react";

function formatPrice(v) {
  return `${Number(v || 0).toFixed(2).replace(".", ",")} €`;
}

function daysBetween(date) {
  const now = new Date();
  const d = new Date(date);
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

export default function CustomersPage({ activePage, setActivePage }) {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [teamOrders, setTeamOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const { data: customersData } = await supabase
      .from("customers")
      .select("*");

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["payée", "livrée"]);

    const { data: teamOrdersData } = await supabase
      .from("team_orders")
      .select("*")
      .in("status", ["payée", "livrée"]);

    setCustomers(customersData || []);
    setOrders(ordersData || []);
    setTeamOrders(teamOrdersData || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // 🔥 CALCUL BUSINESS
  const enrichedCustomers = useMemo(() => {
    return customers.map((c) => {
      const individual = orders.filter(
        (o) => o.customer_phone === c.phone
      );

      const team = teamOrders.filter(
        (o) => o.contact_phone === c.phone
      );

      const allOrders = [...individual, ...team];

      const totalSpent = allOrders.reduce(
        (sum, o) => sum + Number(o.total_price || 0),
        0
      );

      const lastOrder = allOrders.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];

      return {
        ...c,
        ordersCount: allOrders.length,
        totalSpent,
        lastOrderDate: lastOrder?.created_at,
        isTeamClient: team.length > 0,
      };
    });
  }, [customers, orders, teamOrders]);

  // 🔥 TRI INTELLIGENT
  const topClients = [...enrichedCustomers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const clientsToRelance = enrichedCustomers.filter((c) => {
    if (!c.lastOrderDate) return false;
    return daysBetween(c.lastOrderDate) > 3 && c.ordersCount > 0;
  });

  return (
    <MainLayout activePage={activePage} setActivePage={setActivePage}>
      <div className="mb-8">
        <h1 className="text-3xl font-black">Clients</h1>
        <p className="text-slate-400">
          Analyse business des clients
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 p-6 rounded-2xl">
          <Users />
          <p>Total clients</p>
          <p className="text-3xl font-black">{customers.length}</p>
        </div>

        <div className="bg-white/10 p-6 rounded-2xl">
          <TrendingUp />
          <p>Top client</p>
          <p className="text-xl font-black">
            {topClients[0]?.name || "-"}
          </p>
        </div>

        <div className="bg-white/10 p-6 rounded-2xl">
          <Clock />
          <p>À relancer</p>
          <p className="text-3xl font-black">
            {clientsToRelance.length}
          </p>
        </div>
      </div>

      {/* 🔥 TOP CLIENTS */}
      <div className="mb-8">
        <h2 className="text-xl font-black mb-4">🔥 Top clients</h2>

        <div className="space-y-3">
          {topClients.map((c) => (
            <div key={c.id} className="bg-white/10 p-4 rounded-xl">
              <p className="font-bold">{c.name}</p>
              <p className="text-sm">{c.company_name}</p>
              <p>{formatPrice(c.totalSpent)}</p>
              <p>{c.ordersCount} commandes</p>

              <a
                href={`https://wa.me/${c.phone}`}
                className="text-cyan-400 text-sm"
              >
                Contacter WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ⚠️ CLIENTS À RELANCER */}
      <div>
        <h2 className="text-xl font-black mb-4">⚠️ À relancer</h2>

        <div className="space-y-3">
          {clientsToRelance.map((c) => (
            <div key={c.id} className="bg-red-500/10 p-4 rounded-xl">
              <p className="font-bold">{c.name}</p>
              <p>{c.company_name}</p>
              <p>
                Dernière commande :{" "}
                {new Date(c.lastOrderDate).toLocaleDateString()}
              </p>

              <a
                href={`https://wa.me/${c.phone}`}
                className="text-red-300"
              >
                Relancer
              </a>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}