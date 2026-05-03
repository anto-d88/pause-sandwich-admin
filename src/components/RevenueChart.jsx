import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function buildSevenDaysData(data = []) {
  const today = new Date();

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    const label = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });

    const existing = data.find((item) => item.day === label);

    return {
      day: label,
      revenue: existing ? Number(existing.revenue || 0) : 0,
    };
  });

  return days;
}

export default function RevenueChart({ data }) {
  const chartData = buildSevenDaysData(data);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <h2 className="mb-4 text-lg font-semibold">Chiffre d’affaires</h2>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "#020617",
                border: "1px solid #334155",
                borderRadius: "12px",
                color: "#fff",
              }}
              formatter={(value) => [`${Number(value).toFixed(2)} €`, "CA"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#38bdf8"
              fill="url(#revenue)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}