import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Compass, Sun, Waves, Wind } from "lucide-react";
import type { Forecast, WindSession } from "./lib/types";
import { formatGeneratedAt, DISPLAY_LOCALE } from "./lib/date";
import { getKiteExcuse } from "./lib/dailyExcuses";
import { qualityLabel } from "./lib/quality";
import { useCalendarFeed } from "./lib/useCalendarFeed";
import { sampleForecast } from "./lib/sampleForecast";
import { SessionCard } from "./components/SessionCard";
import { StatCard } from "./components/StatCard";
import { WeeklyCalendar } from "./components/WeeklyCalendar";

export default function App() {
  const [forecast, setForecast] = useState<Forecast>(sampleForecast);
  const [usingSample, setUsingSample] = useState<boolean>(true);
  const { feedUrl, subscribeUrl } = useCalendarFeed();

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
  const rideCount = sessions.length;
  const rideCountValue = rideCount === 0
    ? "0 sesh 😭"
    : rideCount === 1
      ? "1 sesh incoming 🪁"
      : `${rideCount} sesh incoming 🪁🔥`;
  const windHours = sessions.reduce((sum: number, session: WindSession) => sum + session.durationHours, 0).toFixed(0);
  const nextRide = sessions[0]
    ? `${new Date(sessions[0].start).toLocaleDateString(DISPLAY_LOCALE, { weekday: "short" })} ${sessions[0].startTime}`
    : "—";
  const maxWave = sessions.length ? `${Math.max(...sessions.map((s: WindSession) => s.maxWaveM)).toFixed(1)} m` : "—";
  const topSessions = useMemo<WindSession[]>(() => sessions.slice(0, 6), [sessions]);
  const nextSession = sessions[0] ?? null;
  const excuseDate = nextSession?.date ?? new Date().toISOString().slice(0, 10);
  const heroExcuse = getKiteExcuse(excuseDate);
  const heroDateLabel = new Date(nextSession?.start ?? `${excuseDate}T12:00:00`).toLocaleDateString(DISPLAY_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
                <a className="primary" href={feedUrl || "./tarifa-wind.ics"}><CalendarDays size={18} /> Add to calendar</a>
                <a className="secondary" href={subscribeUrl || feedUrl || "./tarifa-wind.ics"}><CalendarDays size={18} /> Subscribe to this calendar</a>
              </div>
              <p className="subscribe-hint">
                <strong>Add to calendar</strong> uses the .ics link for a one-time import.
                <strong> Subscribe</strong> uses the webcal URL so Google, Apple, or Outlook keeps updating automatically.
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
            <p className="hero-card-date">{heroDateLabel}</p>
            <p className="hero-card-excuse">{heroExcuse}</p>
            <h2>{nextSession ? `${nextSession.emoji} ${nextSession.windLabel}` : "Asking the wind nicely…"}</h2>
            <p className="hero-card-detail">
              {nextSession
                ? `${nextSession.startTime}–${nextSession.endTime} · ${nextSession.avgWindKt} kt avg · ${nextSession.durationHours}h · ${qualityLabel(nextSession.quality)}`
                : "Wind radio silence for now."}
            </p>
            <div className="micro">
              {nextSession ? (
                <>
                  <span><Compass size={15} /> {nextSession.compass} {nextSession.windArrow}</span>
                  <span><Waves size={15} /> {nextSession.maxWaveM} m swell</span>
                  <span><Wind size={15} /> {nextSession.maxGustKt} kt gusts</span>
                </>
              ) : (
                <span>No wind intel yet</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <StatCard icon={<Wind />} label="next 7 days — laptop stays closed, wind wins 🤙🌬️" value={rideCountValue} />
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
