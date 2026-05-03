import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function OrdersSlotChart({ data }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <h2 className="mb-4 text-lg font-semibold">Commandes par créneau</h2>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="slot" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "#020617",
                border: "1px solid #334155",
                borderRadius: "12px",
              }}
            />
            <Bar dataKey="commandes" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}