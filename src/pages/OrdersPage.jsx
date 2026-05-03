import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  RefreshCw,
  Users,
  ShoppingCart,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { supabase } from "../services/supabase";

const VALID_PAID_STATUSES = ["payée", "en_preparation", "livrée"];

function formatPrice(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} €`;
}

function getOrderTotal(order, items = []) {
  if (order.total_amount) return Number(order.total_amount);
  if (order.total_price) return Number(order.total_price);

  return items.reduce((sum, item) => {
    return sum + Number(item.unit_price || 0) * Number(item.quantity || 1);
  }, 0);
}

export default function OrdersPage({ activePage, setActivePage }) {
  const [paidIndividualOrders, setPaidIndividualOrders] = useState([]);
  const [paidTeamOrders, setPaidTeamOrders] = useState([]);
  const [openTeamOrders, setOpenTeamOrders] = useState([]);
  const [abandonedTeamOrders, setAbandonedTeamOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [teamOrderItems, setTeamOrderItems] = useState([]);
  const [activeTab, setActiveTab] = useState("paid");
  const [loading, setLoading] = useState(true);

  async function markOldOpenOrdersAsAbandoned() {
    const limitDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("team_orders")
      .update({ status: "abandonnée" })
      .eq("status", "ouverte")
      .lt("created_at", limitDate);

    if (error) {
      console.error("Erreur passage en abandonnée:", error);
    }
  }

  async function loadData() {
    setLoading(true);

    await markOldOpenOrdersAsAbandoned();

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .in("status", VALID_PAID_STATUSES)
      .order("created_at", { ascending: false });

    const { data: teamPaidData, error: teamPaidError } = await supabase
      .from("team_orders")
      .select("*")
      .in("status", VALID_PAID_STATUSES)
      .order("created_at", { ascending: false });

    const { data: teamOpenData, error: teamOpenError } = await supabase
      .from("team_orders")
      .select("*")
      .eq("status", "ouverte")
      .order("created_at", { ascending: false });

    const { data: teamAbandonedData, error: teamAbandonedError } = await supabase
      .from("team_orders")
      .select("*")
      .eq("status", "abandonnée")
      .order("created_at", { ascending: false });

    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .select("*");

    const { data: teamOrderItemsData, error: teamOrderItemsError } =
      await supabase.from("team_order_items").select("*");

    if (ordersError) console.error("Erreur orders:", ordersError);
    if (teamPaidError) console.error("Erreur team paid:", teamPaidError);
    if (teamOpenError) console.error("Erreur team open:", teamOpenError);
    if (teamAbandonedError)
      console.error("Erreur team abandoned:", teamAbandonedError);
    if (orderItemsError) console.error("Erreur order items:", orderItemsError);
    if (teamOrderItemsError)
      console.error("Erreur team order items:", teamOrderItemsError);

    setPaidIndividualOrders(ordersData || []);
    setPaidTeamOrders(teamPaidData || []);
    setOpenTeamOrders(teamOpenData || []);
    setAbandonedTeamOrders(teamAbandonedData || []);
    setOrderItems(orderItemsData || []);
    setTeamOrderItems(teamOrderItemsData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const paidOrders = useMemo(() => {
    const individual = paidIndividualOrders.map((order) => {
      const items = orderItems.filter((item) => item.order_id === order.id);

      return {
        ...order,
        type: "individual",
        label: "Individuelle",
        items,
        total: getOrderTotal(order, items),
      };
    });

    const team = paidTeamOrders.map((order) => {
      const items = teamOrderItems.filter(
        (item) => item.team_order_id === order.id
      );

      return {
        ...order,
        type: "team",
        label: "Équipe",
        items,
        total: getOrderTotal(order, items),
      };
    });

    return [...individual, ...team].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [paidIndividualOrders, paidTeamOrders, orderItems, teamOrderItems]);

  const openOrders = useMemo(() => {
    return openTeamOrders.map((order) => {
      const items = teamOrderItems.filter(
        (item) => item.team_order_id === order.id
      );

      return {
        ...order,
        type: "team_open",
        label: "Équipe ouverte",
        items,
        total: getOrderTotal(order, items),
      };
    });
  }, [openTeamOrders, teamOrderItems]);

  const abandonedOrders = useMemo(() => {
    return abandonedTeamOrders.map((order) => {
      const items = teamOrderItems.filter(
        (item) => item.team_order_id === order.id
      );

      return {
        ...order,
        type: "team_abandoned",
        label: "Équipe abandonnée",
        items,
        total: getOrderTotal(order, items),
      };
    });
  }, [abandonedTeamOrders, teamOrderItems]);

  const totalPaidRevenue = paidOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  async function updateTeamStatus(orderId, status) {
    const { error } = await supabase
      .from("team_orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      console.error("Erreur update team order:", error);
      return;
    }

    loadData();
  }

  async function updateIndividualStatus(orderId, status) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      console.error("Erreur update order:", error);
      return;
    }

    loadData();
  }

  async function deleteAbandonedTeamOrder(orderId) {
    const confirmDelete = window.confirm(
      "Supprimer définitivement cette commande abandonnée ?"
    );

    if (!confirmDelete) return;

    const { error: itemsError } = await supabase
      .from("team_order_items")
      .delete()
      .eq("team_order_id", orderId);

    if (itemsError) {
      console.error("Erreur suppression items:", itemsError);
      alert("Erreur lors de la suppression des produits.");
      return;
    }

    const { error: orderError } = await supabase
      .from("team_orders")
      .delete()
      .eq("id", orderId)
      .eq("status", "abandonnée");

    if (orderError) {
      console.error("Erreur suppression commande:", orderError);
      alert("Erreur lors de la suppression de la commande.");
      return;
    }

    loadData();
  }

  const displayedOrders =
    activeTab === "open"
      ? openOrders
      : activeTab === "abandoned"
      ? abandonedOrders
      : paidOrders;

  return (
    <MainLayout activePage={activePage} setActivePage={setActivePage}>
      <div className="min-h-screen text-white">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Commandes
            </p>
            <h1 className="text-3xl font-black">Commandes clients</h1>
            <p className="mt-1 text-slate-400">
              Les vraies commandes sont uniquement les commandes payées.
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/20 px-4 py-3 text-cyan-200 hover:bg-cyan-500/30"
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/25 to-slate-900 p-6">
            <ShoppingCart className="mb-4 text-cyan-300" />
            <p className="text-sm text-slate-300">Commandes payées</p>
            <p className="text-4xl font-black">{paidOrders.length}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/25 to-slate-900 p-6">
            <p className="text-sm text-slate-300">CA validé</p>
            <p className="text-4xl font-black text-emerald-300">
              {formatPrice(totalPaidRevenue)}
            </p>
          </div>

          <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/25 to-slate-900 p-6">
            <Users className="mb-4 text-violet-300" />
            <p className="text-sm text-slate-300">Équipes ouvertes</p>
            <p className="text-4xl font-black">{openOrders.length}</p>
          </div>

          <div className="rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-500/25 to-slate-900 p-6">
            <AlertCircle className="mb-4 text-red-300" />
            <p className="text-sm text-slate-300">Abandonnées</p>
            <p className="text-4xl font-black">{abandonedOrders.length}</p>
          </div>
        </section>

        <section className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab("paid")}
            className={`rounded-xl px-4 py-2 font-bold ${
              activeTab === "paid"
                ? "bg-cyan-400 text-slate-950"
                : "bg-white/10 text-white"
            }`}
          >
            À préparer / payées
          </button>

          <button
            onClick={() => setActiveTab("open")}
            className={`rounded-xl px-4 py-2 font-bold ${
              activeTab === "open"
                ? "bg-violet-400 text-slate-950"
                : "bg-white/10 text-white"
            }`}
          >
            Équipes ouvertes
          </button>

          <button
            onClick={() => setActiveTab("abandoned")}
            className={`rounded-xl px-4 py-2 font-bold ${
              activeTab === "abandoned"
                ? "bg-red-400 text-slate-950"
                : "bg-white/10 text-white"
            }`}
          >
            Abandonnées
          </button>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white/10 p-8 text-slate-300">
            Chargement...
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="rounded-3xl bg-white/10 p-8 text-slate-300">
            Aucune commande dans cette catégorie.
          </div>
        ) : (
          <section className="space-y-4">
            {displayedOrders.map((order) => (
              <article
                key={`${order.type}-${order.id}`}
                className={`rounded-3xl border p-5 ${
                  order.type === "team_open"
                    ? "border-violet-400/30 bg-violet-500/10"
                    : order.type === "team_abandoned"
                    ? "border-red-400/30 bg-red-500/10"
                    : "border-white/10 bg-white/10"
                }`}
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="text-xl font-black">
                        Commande #{order.id}
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                        {order.label}
                      </span>

                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold">
                        {order.status}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300">
                      Client : {order.customer_name || order.contact_name || "-"}
                    </p>
                    <p className="text-sm text-slate-300">
                      Téléphone :{" "}
                      {order.customer_phone || order.contact_phone || "-"}
                    </p>
                    <p className="text-sm text-slate-300">
                      Entreprise : {order.company_name || order.team_name || "-"}
                    </p>
                    <p className="text-sm text-slate-300">
                      Adresse : {order.delivery_address || "-"}
                    </p>
                    <p className="text-sm text-slate-300">
                      Créneau :{" "}
                      {order.delivery_slot_label || order.delivery_slot || "-"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Créée le :{" "}
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString("fr-FR")
                        : "-"}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-3xl font-black text-emerald-300">
                      {formatPrice(order.total)}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {order.items.length} produit(s)
                    </p>

                    {order.type === "team_open" && (
                      <div className="mt-3 flex items-center gap-2 text-orange-300">
                        <AlertCircle size={18} />
                        <span className="text-sm font-bold">
                          Non payée — ne pas préparer
                        </span>
                      </div>
                    )}

                    {order.type === "team_abandoned" && (
                      <div className="mt-3 flex items-center gap-2 text-red-300">
                        <AlertCircle size={18} />
                        <span className="text-sm font-bold">
                          Abandonnée — peut être supprimée
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer font-bold text-cyan-300">
                    Voir détails
                  </summary>

                  <div className="mt-4 space-y-2">
                    {order.items.length === 0 ? (
                      <p className="text-slate-400">Aucun produit ajouté.</p>
                    ) : (
                      order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-3 rounded-2xl bg-slate-950/50 p-3 md:flex-row"
                        >
                          <div>
                            <p className="font-bold">
                              {item.product_name ||
                                item.sandwich_name ||
                                item.item_type ||
                                "Produit"}
                            </p>
                            {item.participant_name && (
                              <p className="text-sm text-slate-400">
                                Participant : {item.participant_name}
                              </p>
                            )}
                          </div>

                          <p className="font-bold">
                            x{item.quantity} —{" "}
                            {formatPrice(
                              Number(item.unit_price || 0) *
                                Number(item.quantity || 1)
                            )}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </details>

                {order.type !== "team_open" &&
                  order.type !== "team_abandoned" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          order.type === "team"
                            ? updateTeamStatus(order.id, "en_preparation")
                            : updateIndividualStatus(order.id, "en_preparation")
                        }
                        className="rounded-xl border border-orange-400/30 bg-orange-500/20 px-4 py-2 font-bold text-orange-200"
                      >
                        En préparation
                      </button>

                      <button
                        onClick={() =>
                          order.type === "team"
                            ? updateTeamStatus(order.id, "livrée")
                            : updateIndividualStatus(order.id, "livrée")
                        }
                        className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 font-bold text-emerald-200"
                      >
                        Livrée
                      </button>
                    </div>
                  )}

                {order.type === "team_abandoned" && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => deleteAbandonedTeamOrder(order.id)}
                      className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2 font-bold text-red-200"
                    >
                      <Trash2 size={18} />
                      Supprimer définitivement
                    </button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </MainLayout>
  );
}