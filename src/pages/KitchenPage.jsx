import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { supabase } from "../services/supabase";
import { ChefHat, RefreshCcw, ShoppingCart, Users } from "lucide-react";

const formatMoney = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);

const statusColumns = [
  { id: "nouvelle", label: "Nouvelles", color: "border-red-400/30 bg-red-500/10" },
  { id: "en préparation", label: "En préparation", color: "border-orange-400/30 bg-orange-500/10" },
  { id: "livrée", label: "Terminées", color: "border-emerald-400/30 bg-emerald-500/10" },
];

export default function KitchenPage({ activePage, setActivePage }) {
  const [orders, setOrders] = useState([]);
  const [teamOrders, setTeamOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [teamOrderItems, setTeamOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadKitchen() {
    setLoading(true);

    const [ordersResult, teamOrdersResult, orderItemsResult, teamItemsResult] =
      await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: true }),
        supabase.from("team_orders").select("*").order("created_at", { ascending: true }),
        supabase.from("order_items").select("*"),
        supabase.from("team_order_items").select("*"),
      ]);

    if (!ordersResult.error) setOrders(ordersResult.data || []);
    if (!teamOrdersResult.error) setTeamOrders(teamOrdersResult.data || []);
    if (!orderItemsResult.error) setOrderItems(orderItemsResult.data || []);
    if (!teamItemsResult.error) setTeamOrderItems(teamItemsResult.data || []);

    if (ordersResult.error) console.error("orders", ordersResult.error);
    if (teamOrdersResult.error) console.error("team_orders", teamOrdersResult.error);
    if (orderItemsResult.error) console.error("order_items", orderItemsResult.error);
    if (teamItemsResult.error) console.error("team_order_items", teamItemsResult.error);

    setLoading(false);
  }

  async function updateStatus(order) {
    const nextStatus =
      order.status === "nouvelle"
        ? "en préparation"
        : order.status === "en préparation"
        ? "livrée"
        : "livrée";

    const table = order.order_type === "team" ? "team_orders" : "orders";

    const { error } = await supabase
      .from(table)
      .update({ status: nextStatus })
      .eq("id", order.id);

    if (error) {
      console.error(error);
      alert("Erreur changement statut");
      return;
    }

    await loadKitchen();
  }

  useEffect(() => {
    loadKitchen();

    const channel = supabase
      .channel("kitchen-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadKitchen)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_orders" }, loadKitchen)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, loadKitchen)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_order_items" }, loadKitchen)
      .subscribe();

    const interval = setInterval(loadKitchen, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const allOrders = [
    ...orders.map((order) => ({
      ...order,
      order_type: "individual",
      type_label: "Individuelle",
      total_display: order.total_amount ?? order.total_price ?? order.total ?? 0,
    })),
    ...teamOrders.map((order) => ({
      ...order,
      order_type: "team",
      type_label: "Équipe",
      total_display: order.total_amount ?? order.total_price ?? order.total ?? 0,
    })),
  ].filter((order) => order.status !== "annulée");

  function getItems(order) {
    if (order.order_type === "team") {
      return teamOrderItems.filter((item) => Number(item.team_order_id) === Number(order.id));
    }

    return orderItems.filter((item) => Number(item.order_id) === Number(order.id));
  }

  function getItemName(item) {
    return (
      item.product_name ||
      item.name ||
      item.item_name ||
      item.sandwich_name ||
      item.formula_name ||
      item.item_type ||
      "Produit"
    );
  }

  function getItemDetails(item) {
    const details = [];

    if (item.participant_name) details.push(`👤 ${item.participant_name}`);
    if (item.item_type) details.push(`Type : ${item.item_type}`);
    if (item.boisson_name) details.push(`Boisson : ${item.boisson_name}`);
    if (item.dessert_name) details.push(`Dessert : ${item.dessert_name}`);
    if (item.crudites) details.push(`Crudités : ${item.crudites}`);
    if (item.sauce) details.push(`Sauce : ${item.sauce}`);
    if (item.comment) details.push(`Note : ${item.comment}`);
    if (item.note) details.push(`Note : ${item.note}`);

    return details;
  }

  return (
    <MainLayout activePage={activePage} setActivePage={setActivePage}>
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            MODE CUISINE
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-black">
            <ChefHat className="text-cyan-300" />
            Préparation commandes
          </h1>
          <p className="mt-2 text-slate-400">
            Écran de production : nouvelles commandes, préparation et commandes terminées.
          </p>
        </div>

        <button
          onClick={loadKitchen}
          className="flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-cyan-200 hover:bg-cyan-500/20"
        >
          <RefreshCcw size={18} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400">Chargement cuisine...</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          {statusColumns.map((column) => {
            const columnOrders = allOrders.filter(
              (order) => (order.status || "nouvelle") === column.id
            );

            return (
              <section
                key={column.id}
                className={`min-h-[600px] rounded-3xl border p-4 ${column.color}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black">{column.label}</h2>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {columnOrders.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucune commande.</p>
                  ) : (
                    columnOrders.map((order) => {
                      const items = getItems(order);
                      const isTeam = order.order_type === "team";

                      const customer =
                        order.customer_name ||
                        order.contact_name ||
                        order.name ||
                        "Client";

                      const slot =
                        order.delivery_slot ||
                        order.slot ||
                        order.delivery_time ||
                        "-";

                      const phone =
                        order.customer_phone ||
                        order.contact_phone ||
                        order.phone ||
                        "-";

                      return (
                        <article
                          key={`${order.order_type}-${order.id}`}
                          className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-xl"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                {isTeam ? (
                                  <Users className="text-purple-300" size={19} />
                                ) : (
                                  <ShoppingCart className="text-cyan-300" size={19} />
                                )}

                                <h3 className="text-lg font-black">
                                  #{order.id} · {order.type_label}
                                </h3>
                              </div>

                              <p className="mt-1 text-sm text-slate-300">
                                {customer}
                              </p>
                              <p className="text-sm text-slate-400">
                                Créneau : {slot}
                              </p>
                              <p className="text-sm text-slate-400">
                                Tel : {phone}
                              </p>
                            </div>

                            <p className="text-lg font-black text-emerald-300">
                              {formatMoney(order.total_display)}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {items.length === 0 ? (
                              <p className="rounded-xl bg-white/5 p-3 text-sm text-slate-400">
                                Aucun détail produit.
                              </p>
                            ) : (
                              items.map((item) => {
                                const details = getItemDetails(item);

                                return (
                                  <div
                                    key={item.id}
                                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="font-bold">
                                        {getItemName(item)}
                                      </p>
                                      <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-100">
                                        x{item.quantity || 1}
                                      </span>
                                    </div>

                                    {details.length > 0 && (
                                      <div className="mt-2 space-y-1 text-sm text-slate-300">
                                        {details.map((detail) => (
                                          <p key={detail}>{detail}</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {order.status !== "livrée" && (
                            <button
                              onClick={() => updateStatus(order)}
                              className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950 hover:bg-emerald-400"
                            >
                              {order.status === "nouvelle"
                                ? "Passer en préparation"
                                : "Marquer terminée"}
                            </button>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}