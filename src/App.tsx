import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Compass, Star, Sun, Waves, Wind } from "lucide-react";
import type { Forecast, WindSession } from "./lib/types";
import { formatGeneratedAt } from "./lib/date";
import { qualityLabel } from "./lib/quality";
import { sampleForecast } from "./lib/sampleForecast";
import { SessionCard } from "./components/SessionCard";
import { StatCard } from "./components/StatCard";
import { WeeklyCalendar } from "./components/WeeklyCalendar";

export default function App() {
  const [forecast, setForecast] = useState<Forecast>(sampleForecast);
  const [usingSample, setUsingSample] = useState<boolean>(true);

  useEffect(() => {
    fetch("./forecast.json", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("forecast.json not generated yet");
        return res.json() as Promise<Forecast>;
      })
      .then((data) => {
        setForecast(data);
        setUsingSample(false);
      })
      .catch(() => {
        setForecast(sampleForecast);
        setUsingSample(true);
      });
  }, []);

  const sessions: WindSession[] = forecast.sessions || [];
  const bestSession = sessions.length
    ? sessions.reduce((best, s) => (s.score > best.score ? s : best), sessions[0])
    : null;
  const windHours = sessions.reduce((sum: number, session: WindSession) => sum + session.durationHours, 0).toFixed(0);
  const nextRide = sessions[0]
    ? `${new Date(sessions[0].start).toLocaleDateString(undefined, { weekday: "short" })} ${sessions[0].startTime}`
    : "—";
  const maxWave = sessions.length ? `${Math.max(...sessions.map((s: WindSession) => s.maxWaveM)).toFixed(1)} m` : "—";
  const topSessions = useMemo<WindSession[]>(() => sessions.slice(0, 6), [sessions]);

  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <div className="brand">
            <img className="brand-logo" src="./tarifa-logo.svg" alt="" />
            Tarifa Wind
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <h1>Meetings can wait.<br />The wind can&apos;t.</h1>
            <p>
              Block the good sessions first, then squeeze your calls into the flat bits
              like a responsible nomad who definitely won&apos;t skip a meeting for 18 knots.
            </p>
            <div className="hero-buttons">
              <div className="hero-cta-row">
                <a className="secondary" href="./tarifa-wind.ics"><CalendarDays size={18} /> Subscribe</a>
                <a className="primary" href="./tarifa-wind.ics"><CalendarDays size={18} /> Add to calendar</a>
              </div>
              <p className="subscribe-hint">
                <strong>Subscribe</strong> = live updates when the wind changes its mind.
                <strong> Add to calendar</strong> = one-time import. Same feed, less FOMO.
              </p>
            </div>
            {usingSample && (
              <p className="notice">Demo mode — real Tarifa wind incoming soon.</p>
            )}
          </div>

          <div className="hero-card glass">
            <img
              className="hero-illustration"
              src="./tarifa-kite-hero.png"
              alt="Cartoon view of Tarifa beach with a kite in the sky"
            />
            <p className="hero-card-label">Next excuse to leave your desk</p>
            <h2>{sessions[0] ? `${sessions[0].emoji} ${sessions[0].windLabel}` : "Asking the wind nicely…"}</h2>
            <p className="hero-card-detail">
              {sessions[0]
                ? `${sessions[0].startTime}–${sessions[0].endTime} · ${sessions[0].avgWindKt} kt avg · ${sessions[0].durationHours}h · ${qualityLabel(sessions[0].quality)}`
                : "Wind radio silence for now."}
            </p>
            <div className="micro">
              {sessions[0] ? (
                <>
                  <span><Compass size={15} /> {sessions[0].compass} {sessions[0].windArrow}</span>
                  <span><Waves size={15} /> {sessions[0].maxWaveM} m swell</span>
                  <span><Wind size={15} /> {sessions[0].maxGustKt} kt gusts</span>
                </>
              ) : (
                <span>No wind intel yet</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <StatCard icon={<Wind />} label="Ride windows" value={sessions.length} />
        <StatCard icon={<Star />} label="Peak send" value={bestSession ? `${qualityLabel(bestSession.quality)} · ${bestSession.avgWindKt} kt` : "—"} />
        <StatCard icon={<Sun />} label="Hours of freedom" value={windHours} />
        <StatCard icon={<Waves />} label="Biggest swell" value={maxWave} />
      </section>

      <WeeklyCalendar sessions={sessions} />

      <section className="cards-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">The shortlist</p>
            <h2>When to bail on your laptop</h2>
          </div>
          <div className="next-ride">Next bail-out · {nextRide}</div>
        </div>
        <div className="session-list">
          {topSessions.length ? topSessions.map((session: WindSession) => (
            <SessionCard key={session.id} session={session} />
          )) : (
            <div className="glass empty-card">No wind on the menu. Tragic. Emails it is. ☕</div>
          )}
        </div>
      </section>

      <footer>
        <p className="footer-meta">
          Updated {formatGeneratedAt(forecast.generatedAt)} · {forecast.spot} · {forecast.profile}
        </p>
        <p className="footer-source">
          Wind data from{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
          {" "}· swell from{" "}
          <a href="https://open-meteo.com/en/docs/marine-weather-api" target="_blank" rel="noopener noreferrer">Open-Meteo Marine</a>
        </p>
      </footer>
    </main>
  );
}
