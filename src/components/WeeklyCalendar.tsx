import type { WindSession } from "../lib/types";
import { qualityClass, qualityLabel } from "../lib/quality";
import { addDays, isoLocal, minutesSinceMidnight, startOfDay } from "../lib/date";

const CAL_START = 8;
const CAL_END = 21;
const CAL_SPAN = CAL_END - CAL_START;
const HOURS = Array.from({ length: CAL_SPAN }, (_, i) => CAL_START + i);

type Props = {
  sessions: WindSession[];
};

export function WeeklyCalendar({ sessions }: Props) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const byDate = new Map<string, WindSession[]>();
  for (const session of sessions) {
    if (!byDate.has(session.date)) byDate.set(session.date, []);
    byDate.get(session.date)?.push(session);
  }

  return (
    <section className="calendar-shell glass">
      <div className="section-head">
        <div>
          <p className="eyebrow">Wind vs. work</p>
          <h2>Next 7 days</h2>
        </div>
        <a className="mini-link" href="./tarifa-wind.ics">Sync to calendar →</a>
      </div>

      <div className="calendar">
        <div className="hours">
          <div className="day-spacer" />
          {HOURS.map((hour) => (
            <div key={hour} className="hour">{String(hour).padStart(2, "0")}:00</div>
          ))}
        </div>

        <div className="days">
          {days.map((day) => {
            const key = isoLocal(day);
            const daySessions = byDate.get(key) || [];

            return (
              <div className="day-col" key={key}>
                <div className="day-title">
                  <b>{day.toLocaleDateString(undefined, { weekday: "short" })}</b>
                  <span>{day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>

                <div className="day-track">
                  {daySessions.length === 0 && <div className="no-wind">Zoom might survive 😇</div>}

                  {daySessions.map((session) => {
                    const start = new Date(session.start);
                    const end = new Date(session.end);
                    const startMin = Math.max(CAL_START * 60, minutesSinceMidnight(start));
                    const endMin = Math.min(CAL_END * 60, minutesSinceMidnight(end));
                    const top = ((startMin - CAL_START * 60) / (CAL_SPAN * 60)) * 100;
                    const height = Math.max(9, ((endMin - startMin) / (CAL_SPAN * 60)) * 100);

                    return (
                      <div
                        key={session.id}
                        className={`cal-event ${qualityClass(session.quality)}`}
                        style={{ top: `${top}%`, height: `${height}%` }}
                        title={session.description}
                      >
                        <strong>{session.emoji} {session.windLabel}</strong>
                        <span>{session.startTime}–{session.endTime}</span>
                        <span>{session.avgWindKt} kt · {session.durationHours}h · {qualityLabel(session.quality)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
