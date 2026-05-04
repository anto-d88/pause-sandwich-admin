import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import StockPage from "./pages/StockPage";
import MessagesPage from "./pages/MessagesPage";
import KitchenPage from "./pages/KitchenPage";
import CustomersPage from "./pages/CustomersPage";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {activePage === "dashboard" && (
        <Dashboard activePage={activePage} setActivePage={setActivePage} />
      )}

      {activePage === "orders" && (
        <OrdersPage activePage={activePage} setActivePage={setActivePage} />
      )}

      {activePage === "kitchen" && (
        <KitchenPage activePage={activePage} setActivePage={setActivePage} />
      )}

      {activePage === "stock" && (
        <StockPage activePage={activePage} setActivePage={setActivePage} />
      )}

      {activePage === "messages" && (
        <MessagesPage activePage={activePage} setActivePage={setActivePage} />
      )}

      {activePage === "customers" && (
        <CustomersPage activePage={activePage} setActivePage={setActivePage} />
      )}
    </div>
  );
}

export default App;