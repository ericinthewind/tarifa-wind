import type { WindSession } from "../lib/types";
import { getHolidayExcuse } from "../lib/holidayExcuses";
import { qualityClass, qualityLabel } from "../lib/quality";

type Props = {
  session: WindSession;
};

export function SessionCard({ session }: Props) {
  const dayLabel = new Date(session.start).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const holidayExcuse = getHolidayExcuse(session.date);

  return (
    <article className={`session-card ${qualityClass(session.quality)}`}>
      <div className="session-top">
        <span className="pill">{session.emoji} {qualityLabel(session.quality)}</span>
        <span className="session-duration">{session.durationHours}h of freedom</span>
      </div>
      <p className="session-day">{dayLabel}</p>
      {holidayExcuse && <p className="session-excuse">{holidayExcuse}</p>}
      <h3>{session.windArrow} {session.windLabel}</h3>
      <p className="time">{session.startTime}–{session.endTime} · {session.durationHours}h</p>
      <div className="session-grid">
        <span>💨 {session.avgWindKt} kt</span>
        <span>🌪️ {session.maxGustKt} kt</span>
        <span>🧭 {session.compass}</span>
        <span>🌊 {session.maxWaveM} m</span>
      </div>
    </article>
  );
}
