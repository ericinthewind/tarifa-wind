import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WindSession } from "../lib/types";

type Props = {
  sessions: WindSession[];
};

export function WindChart({ sessions }: Props) {
  const data = sessions.slice(0, 10).map((session) => ({
    label: `${new Date(session.start).toLocaleDateString(undefined, { weekday: "short" })} ${session.startTime}`,
    wind: session.avgWindKt,
    gust: session.maxGustKt,
  }));

  return (
    <section className="chart-shell glass">
      <div className="section-head">
        <div>
          <p className="eyebrow">Wind o&apos;clock</p>
          <h2>When the ocean gets loud</h2>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-card">Flat spell. Pretend you&apos;re being productive.</div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barGap={4} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(45, 120, 150, 0.12)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#3d5a6e" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#3d5a6e" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "rgba(94, 196, 196, 0.08)" }}
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.96)",
                  border: "1px solid rgba(45, 120, 150, 0.12)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(32, 92, 122, 0.1)",
                  fontSize: "13px",
                  color: "#1a3a4a",
                }}
              />
              <Bar dataKey="wind" name="Wind kt" fill="#2aabaa" radius={[8, 8, 0, 0]} maxBarSize={28} />
              <Bar dataKey="gust" name="Gust kt" fill="#3d8fbf" radius={[8, 8, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span><i className="legend-dot wind" /> Wind</span>
            <span><i className="legend-dot gust" /> Gust</span>
          </div>
        </div>
      )}
    </section>
  );
}
