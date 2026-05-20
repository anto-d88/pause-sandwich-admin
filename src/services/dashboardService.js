import { supabase } from "./supabase";

const VALID_STATUSES = [
  "payée",
  "payé",
  "paid",
  "livrée",
  "livré",
  "en_preparation",
  "en préparation",
  "preparation",
];

const safeNumber = (value) => Number(value || 0);

const normalizeStatus = (status) =>
  String(status || "").toLowerCase().trim();

const isValidOrder = (order) =>
  VALID_STATUSES.includes(normalizeStatus(order.status));

const getParisDateKey = (dateString) => {
  if (!dateString) return "unknown";

  return new Date(dateString).toLocaleDateString("fr-CA", {
    timeZone: "Europe/Paris",
  });
};

const getParisDayLabel = (dateString) => {
  if (!dateString) return "Inconnu";

  return new Date(dateString).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
  });
};

const isTodayParis = (dateString) => {
  const todayKey = new Date().toLocaleDateString("fr-CA", {
    timeZone: "Europe/Paris",
  });

  return getParisDateKey(dateString) === todayKey;
};

const getLast7Days = () => {
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const key = date.toLocaleDateString("fr-CA", {
      timeZone: "Europe/Paris",
    });

    const label = date.toLocaleDateString("fr-FR", {
      timeZone: "Europe/Paris",
      day: "2-digit",
      month: "2-digit",
    });

    days.push({ key, label });
  }

  return days;
};

const getOrderTotal = (order, items = []) => {
  const directTotal = safeNumber(
    order.total_amount ?? order.total_price ?? order.total
  );

  if (directTotal > 0) return directTotal;

  return items.reduce((sum, item) => {
    const quantity = safeNumber(item.quantity || 1);
    const unitPrice = safeNumber(
      item.unit_price ??
        item.price ??
        item.formula_price ??
        item.total_price ??
        item.line_total
    );

    return sum + unitPrice * quantity;
  }, 0);
};

const getProductStock = (product) =>
  safeNumber(product.stock ?? product.stock_quantity ?? 0);

const getProductName = (product) =>
  product.name || product.title || product.product_name || `Produit ${product.id}`;

const getProductCategory = (product) =>
  product.category || product.type || product.product_type || "Catégorie inconnue";

const getOrderSlot = (order) => {
  const rawSlot = String(
    order.delivery_slot || order.slot || order.delivery_time || ""
  ).toLowerCase();

  if (rawSlot.includes("11")) return "11h";
  if (rawSlot.includes("13")) return "13h";
  if (rawSlot.includes("15")) return "15h";

  return "autre";
};

export async function getDashboardData() {
  const [
    ordersResult,
    orderItemsResult,
    productsResult,
    teamOrdersResult,
    teamOrderItemsResult,
    messagesResult,
  ] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*"),
    supabase.from("products").select("*").order("id", { ascending: true }),
    supabase.from("team_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("team_order_items").select("*"),
    supabase.from("customer_messages").select("*").order("created_at", { ascending: false }),
  ]);

  const orders = ordersResult.data || [];
  const orderItems = orderItemsResult.data || [];
  const rawProducts = productsResult.data || [];
  const teamOrders = teamOrdersResult.data || [];
  const teamOrderItems = teamOrderItemsResult.data || [];
  const messages = messagesResult.data || [];

  const paidOrders = orders.filter(isValidOrder);
  const paidTeamOrders = teamOrders.filter(isValidOrder);

  const products = rawProducts.map((product) => ({
    ...product,
    display_name: getProductName(product),
    display_category: getProductCategory(product),
    display_stock: getProductStock(product),
  }));

  const countedOrders = [
    ...paidOrders.map((order) => {
      const items = orderItems.filter(
        (item) => Number(item.order_id) === Number(order.id)
      );

      return {
        ...order,
        dashboard_order_type: "individual",
        dashboard_total: getOrderTotal(order, items),
      };
    }),

    ...paidTeamOrders.map((order) => {
      const items = teamOrderItems.filter(
        (item) => Number(item.team_order_id) === Number(order.id)
      );

      return {
        ...order,
        dashboard_order_type: "team",
        dashboard_total: getOrderTotal(order, items),
      };
    }),
  ];

  const paidOrderIds = paidOrders.map((order) => Number(order.id));
  const paidTeamOrderIds = paidTeamOrders.map((order) => Number(order.id));

  const countedItems = [
    ...orderItems
      .filter((item) => paidOrderIds.includes(Number(item.order_id)))
      .map((item) => ({
        ...item,
        dashboard_item_type: "individual",
      })),

    ...teamOrderItems
      .filter((item) => paidTeamOrderIds.includes(Number(item.team_order_id)))
      .map((item) => ({
        ...item,
        dashboard_item_type: "team",
      })),
  ];

  const todayOrders = countedOrders.filter((order) => isTodayParis(order.created_at));

  const totalRevenue = countedOrders.reduce(
    (sum, order) => sum + safeNumber(order.dashboard_total),
    0
  );

  const todayRevenue = todayOrders.reduce(
    (sum, order) => sum + safeNumber(order.dashboard_total),
    0
  );

  const averageBasket =
    countedOrders.length > 0 ? totalRevenue / countedOrders.length : 0;

  const untreatedMessages = messages.filter((msg) =>
    ["nouveau", "new", "", null, undefined].includes(msg.status)
  );

  const criticalStock = products.filter((product) => product.display_stock <= 3);

  const last7Days = getLast7Days();

  const revenueByDay = last7Days.map((day) => {
    const revenue = countedOrders
      .filter((order) => getParisDateKey(order.created_at) === day.key)
      .reduce((sum, order) => sum + safeNumber(order.dashboard_total), 0);

    return {
      day: day.label,
      revenue,
    };
  });

  const ordersBySlot = ["11h", "13h", "15h"].map((slot) => ({
    slot,
    commandes: countedOrders.filter((order) => getOrderSlot(order) === slot).length,
  }));

  const productSalesMap = {};

  countedItems.forEach((item) => {
    const name =
      item.product_name ||
      item.name ||
      item.item_name ||
      item.sandwich_name ||
      item.formula_name ||
      item.item_type ||
      `Produit ${item.product_id || ""}`;

    productSalesMap[name] =
      safeNumber(productSalesMap[name]) + safeNumber(item.quantity || 1);
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const formulasCount = countedItems.filter((item) => {
    const label = String(
      item.item_type ||
        item.product_name ||
        item.name ||
        item.formula_name ||
        ""
    ).toLowerCase();

    return label.includes("formule") || label.includes("menu");
  }).length;

  return {
    kpis: {
      todayRevenue,
      totalRevenue,
      todayOrders: todayOrders.length,
      averageBasket,
      formulasCount,
      teamOrdersCount: paidTeamOrders.length,
      untreatedMessages: untreatedMessages.length,
      criticalStock: criticalStock.length,
    },
    charts: {
      revenueByDay,
      ordersBySlot,
      topProducts,
    },
    lists: {
      orders: countedOrders
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 8),
      individualOrders: orders,
      teamOrders,
      paidTeamOrders,
      products,
      messages: messages.slice(0, 8),
      criticalStock,
    },
  };
}