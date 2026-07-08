#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

SPOT_NAME = os.getenv("SPOT_NAME", "Tarifa")
LATITUDE = float(os.getenv("LATITUDE", "36.0143"))
LONGITUDE = float(os.getenv("LONGITUDE", "-5.6044"))
VALDEVAQUEROS_LAT = float(os.getenv("VALDEVAQUEROS_LAT", "36.0597"))
VALDEVAQUEROS_LON = float(os.getenv("VALDEVAQUEROS_LON", "-5.6531"))
TIMEZONE = os.getenv("TIMEZONE", "Europe/Madrid")
FORECAST_DAYS = int(os.getenv("FORECAST_DAYS", "7"))
PROFILE = os.getenv("PROFILE", "kite").lower()
WIND_SECTORS = os.getenv("WIND_SECTORS", "60-130,240-300")
OUTPUT_JSON = os.getenv("OUTPUT_JSON", "public/forecast.json")
OUTPUT_ICS = os.getenv("OUTPUT_ICS", "public/tarifa-wind.ics")

PROFILE_DEFAULTS = {
    "kite": {"MIN_WIND_KT": 10, "GOOD_WIND_KT": 14, "EXCELLENT_WIND_KT": 17, "MAX_GUST_KT": 30, "MAX_WAVE_M": 1.2, "MIN_BLOCK_HOURS": 2, "MAX_BLOCK_HOURS": 3, "PONIENTE_START_HOUR": 14},
    "wingfoil": {"MIN_WIND_KT": 12, "GOOD_WIND_KT": 16, "EXCELLENT_WIND_KT": 22, "MAX_GUST_KT": 38, "MAX_WAVE_M": 2.2, "MIN_BLOCK_HOURS": 2, "MAX_BLOCK_HOURS": 3, "PONIENTE_START_HOUR": 14},
    "windsurf": {"MIN_WIND_KT": 18, "GOOD_WIND_KT": 22, "EXCELLENT_WIND_KT": 28, "MAX_GUST_KT": 45, "MAX_WAVE_M": 2.5, "MIN_BLOCK_HOURS": 2, "MAX_BLOCK_HOURS": 3, "PONIENTE_START_HOUR": 14},
    "custom": {"MIN_WIND_KT": 16, "GOOD_WIND_KT": 20, "EXCELLENT_WIND_KT": 25, "MAX_GUST_KT": 40, "MAX_WAVE_M": 1.8, "MIN_BLOCK_HOURS": 2, "MAX_BLOCK_HOURS": 3, "PONIENTE_START_HOUR": 14},
}
defaults = PROFILE_DEFAULTS.get(PROFILE, PROFILE_DEFAULTS["kite"])
MIN_WIND_KT = float(os.getenv("MIN_WIND_KT", defaults["MIN_WIND_KT"]))
GOOD_WIND_KT = float(os.getenv("GOOD_WIND_KT", defaults["GOOD_WIND_KT"]))
EXCELLENT_WIND_KT = float(os.getenv("EXCELLENT_WIND_KT", defaults["EXCELLENT_WIND_KT"]))
MAX_GUST_KT = float(os.getenv("MAX_GUST_KT", defaults["MAX_GUST_KT"]))
MAX_WAVE_M = float(os.getenv("MAX_WAVE_M", defaults["MAX_WAVE_M"]))
MIN_BLOCK_HOURS = int(os.getenv("MIN_BLOCK_HOURS", defaults["MIN_BLOCK_HOURS"]))
MAX_BLOCK_HOURS = int(os.getenv("MAX_BLOCK_HOURS", defaults["MAX_BLOCK_HOURS"]))
PONIENTE_START_HOUR = int(os.getenv("PONIENTE_START_HOUR", defaults["PONIENTE_START_HOUR"]))
THERMIC_USE_80M = os.getenv("THERMIC_USE_80M", "1").lower() not in {"0", "false", "no"}

FORECAST_SPOTS: list[tuple[str, float, float]] = [
    ("Tarifa", LATITUDE, LONGITUDE),
    ("Valdevaqueros", VALDEVAQUEROS_LAT, VALDEVAQUEROS_LON),
]


@dataclass
class Hour:
    time: datetime
    wind_kt: float | None
    gust_kt: float | None
    direction: float | None
    wave_m: float | None
    wave_period: float | None
    wind_80m_kt: float | None = None
    wind_120m_kt: float | None = None


def kt(kmh: float | None) -> float | None:
    return None if kmh is None else kmh * 0.539957


def fetch_json(base_url: str, params: dict[str, str | int | float]) -> dict:
    url = base_url + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def parse_sectors(raw: str) -> list[tuple[float, float]]:
    sectors = []
    for part in raw.split(","):
        start, end = part.strip().split("-")
        sectors.append((float(start) % 360, float(end) % 360))
    return sectors


def direction_in_sectors(deg: float | None, sectors: list[tuple[float, float]]) -> bool:
    if deg is None:
        return False
    d = deg % 360
    for start, end in sectors:
        if start <= end and start <= d <= end:
            return True
        if start > end and (d >= start or d <= end):
            return True
    return False


def compass(deg: float | None) -> str:
    if deg is None:
        return "?"
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return dirs[int((deg + 11.25) // 22.5) % 16]


def is_poniente(deg: float | None) -> bool:
    if deg is None:
        return False
    d = deg % 360
    return 225 <= d <= 315


def wind_label(deg: float | None) -> str:
    if deg is None:
        return "Unknown"
    if is_poniente(deg):
        return "Poniente"
    d = deg % 360
    if 45 <= d <= 135:
        return "Levante"
    return compass(d)


def wind_arrow(deg: float | None) -> str:
    if deg is None:
        return "↯"
    arrows = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"]
    return arrows[int(((deg + 22.5) % 360) // 45)]


def fetch_forecast(lat: float, lon: float) -> dict:
    return fetch_json("https://api.open-meteo.com/v1/forecast", {
        "latitude": lat,
        "longitude": lon,
        "hourly": "wind_speed_10m,wind_gusts_10m,wind_direction_10m,wind_speed_80m,wind_speed_120m",
        "wind_speed_unit": "kmh",
        "timezone": TIMEZONE,
        "forecast_days": FORECAST_DAYS,
    })


def fetch_marine(lat: float, lon: float) -> dict:
    return fetch_json("https://marine-api.open-meteo.com/v1/marine", {
        "latitude": lat,
        "longitude": lon,
        "hourly": "wave_height,wave_period,wave_direction",
        "timezone": TIMEZONE,
        "forecast_days": min(FORECAST_DAYS, 8),
    })


def effective_wind_kt(hour: Hour) -> float | None:
    """Afternoon Poniente thermals are often stronger aloft than at 10 m."""
    if hour.wind_kt is None:
        return None
    if (
        THERMIC_USE_80M
        and is_poniente(hour.direction)
        and hour.time.hour >= PONIENTE_START_HOUR
    ):
        aloft = [v for v in (hour.wind_80m_kt, hour.wind_120m_kt) if v is not None]
        if aloft:
            return max(hour.wind_kt, *aloft)
    return hour.wind_kt


def merge_spot_hours(spot_hours: list[list[Hour]]) -> list[Hour]:
    by_time: dict[datetime, Hour] = {}
    for hours in spot_hours:
        for hour in hours:
            existing = by_time.get(hour.time)
            if existing is None:
                by_time[hour.time] = hour
                continue

            pick_new = (hour.wind_kt or 0) >= (existing.wind_kt or 0)
            stronger, weaker = (hour, existing) if pick_new else (existing, hour)
            by_time[hour.time] = Hour(
                time=hour.time,
                wind_kt=max(existing.wind_kt or 0, hour.wind_kt or 0),
                gust_kt=max(existing.gust_kt or 0, hour.gust_kt or 0),
                direction=stronger.direction if (stronger.wind_kt or 0) > 0 else existing.direction,
                wave_m=max(existing.wave_m or 0, hour.wave_m or 0) or None,
                wave_period=stronger.wave_period or existing.wave_period,
                wind_80m_kt=max(existing.wind_80m_kt or 0, hour.wind_80m_kt or 0) or None,
                wind_120m_kt=max(existing.wind_120m_kt or 0, hour.wind_120m_kt or 0) or None,
            )
    return sorted(by_time.values(), key=lambda hour: hour.time)


def merge_hours(weather: dict, marine: dict) -> list[Hour]:
    tz = ZoneInfo(TIMEZONE)
    w = weather["hourly"]
    m = marine.get("hourly", {})
    marine_by_time = {t: i for i, t in enumerate(m.get("time", []))}
    hours = []

    for i, t in enumerate(w["time"]):
        mi = marine_by_time.get(t)
        dt = datetime.fromisoformat(t).replace(tzinfo=tz)
        hours.append(Hour(
            time=dt,
            wind_kt=kt(w.get("wind_speed_10m", [None])[i]),
            gust_kt=kt(w.get("wind_gusts_10m", [None])[i]),
            direction=w.get("wind_direction_10m", [None])[i],
            wave_m=m.get("wave_height", [None] * len(marine_by_time))[mi] if mi is not None else None,
            wave_period=m.get("wave_period", [None] * len(marine_by_time))[mi] if mi is not None else None,
            wind_80m_kt=kt(w.get("wind_speed_80m", [None])[i]),
            wind_120m_kt=kt(w.get("wind_speed_120m", [None])[i]),
        ))
    return hours


def is_usable(hour: Hour) -> bool:
    wind = effective_wind_kt(hour)
    poniente_ok = not is_poniente(hour.direction) or hour.time.hour >= PONIENTE_START_HOUR
    return (
        wind is not None
        and hour.gust_kt is not None
        and wind >= MIN_WIND_KT
        and hour.gust_kt <= MAX_GUST_KT
        and direction_in_sectors(hour.direction, parse_sectors(WIND_SECTORS))
        and poniente_ok
        and (hour.wave_m is None or hour.wave_m <= MAX_WAVE_M)
    )


def build_blocks(hours: list[Hour]) -> list[list[Hour]]:
    blocks = []
    current = []
    for hour in hours:
        if is_usable(hour):
            current.append(hour)
        else:
            if len(current) >= MIN_BLOCK_HOURS:
                blocks.append(current)
            current = []
    if len(current) >= MIN_BLOCK_HOURS:
        blocks.append(current)
    return blocks


def split_blocks(blocks: list[list[Hour]]) -> list[list[Hour]]:
    """Split long ride windows into chunks of at most MAX_BLOCK_HOURS."""
    result: list[list[Hour]] = []
    for block in blocks:
        for i in range(0, len(block), MAX_BLOCK_HOURS):
            chunk = block[i:i + MAX_BLOCK_HOURS]
            if len(chunk) >= MIN_BLOCK_HOURS:
                result.append(chunk)
    return result


def score_session(avg_wind: float, max_gust: float, max_wave: float) -> int:
    wind_score = min(62, max(0, (avg_wind - MIN_WIND_KT) / max(1, EXCELLENT_WIND_KT - MIN_WIND_KT) * 62))
    gust_penalty = max(0, max_gust - EXCELLENT_WIND_KT) * 1.1
    wave_penalty = max(0, max_wave - 1.2) * 8
    return round(max(0, min(100, 38 + wind_score - gust_penalty - wave_penalty)))


def quality(avg_wind: float, score: int) -> tuple[str, str]:
    if avg_wind >= EXCELLENT_WIND_KT or score >= 70:
        return "Excellent", "🟢"
    if avg_wind >= GOOD_WIND_KT or score >= 50:
        return "Good", "🟡"
    return "Worth it", "🤙"


def make_sessions(blocks: list[list[Hour]]) -> list[dict]:
    sessions = []
    for block in blocks:
        start = block[0].time
        end = block[-1].time + timedelta(hours=1)
        avg_wind = sum(effective_wind_kt(h) or 0 for h in block) / len(block)
        max_gust = max(h.gust_kt or 0 for h in block)
        avg_dir = sum(h.direction or 0 for h in block) / len(block)
        max_wave = max(h.wave_m or 0 for h in block)
        avg_period = sum(h.wave_period or 0 for h in block) / len(block)
        score = score_session(avg_wind, max_gust, max_wave)
        q, emoji = quality(avg_wind, score)
        label = wind_label(avg_dir)

        sessions.append({
            "id": f"{start.strftime('%Y%m%dT%H%M')}-{q.lower()}",
            "start": start.isoformat(),
            "end": end.isoformat(),
            "date": start.date().isoformat(),
            "startTime": start.strftime("%H:%M"),
            "endTime": end.strftime("%H:%M"),
            "title": f"{emoji} {q} {label}: {avg_wind:.0f} kn",
        #· score {score}",
            "quality": q,
            "emoji": emoji,
            "windLabel": label,
            "windArrow": wind_arrow(avg_dir),
            "avgWindKt": round(avg_wind, 1),
            "maxGustKt": round(max_gust, 1),
            "directionDeg": round(avg_dir),
            "compass": compass(avg_dir),
            "maxWaveM": round(max_wave, 1),
            "avgPeriodS": round(avg_period),
            #"score": score,
            "durationHours": round((end - start).total_seconds() / 3600, 1),
            "description": (
                f"{SPOT_NAME} wind forecast\n"
                #f"Profile: {PROFILE}\n"
                f"Wind: {avg_wind:.1f} kn {compass(avg_dir)} / {avg_dir:.0f}° ({label})\n"
                f"Gusts: {max_gust:.1f} kt\n"
                f"Waves: {max_wave:.1f} m, period ~{avg_period:.0f} s\n"
                #f"Score: {score}/100"
            ),
        })
    return sessions


def ical_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def fmt_dt(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def fold_ical_line(line: str) -> str:
    if len(line) <= 73:
        return line
    parts = [line[:73]]
    rest = line[73:]
    while rest:
        parts.append(" " + rest[:73])
        rest = rest[73:]
    return "\r\n".join(parts)


def make_ics(sessions: list[dict]) -> str:
    now = datetime.now(timezone.utc)
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//tarifa-wind//open-meteo//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{ical_escape(SPOT_NAME)} Wind",
        f"X-WR-TIMEZONE:{TIMEZONE}",
    ]
    for session in sessions:
        start = datetime.fromisoformat(session["start"])
        end = datetime.fromisoformat(session["end"])
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{session['id']}@tarifa-wind",
            f"DTSTAMP:{fmt_dt(now)}",
            f"DTSTART:{fmt_dt(start)}",
            f"DTEND:{fmt_dt(end)}",
            f"SUMMARY:{ical_escape(session['title'])}",
            f"DESCRIPTION:{ical_escape(session['description'])}",
            f"LOCATION:{ical_escape(SPOT_NAME)}",
            "END:VEVENT",
        ])
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold_ical_line(line) for line in lines) + "\r\n"


def main() -> None:
    spot_hours = [
        merge_hours(fetch_forecast(lat, lon), fetch_marine(lat, lon))
        for _, lat, lon in FORECAST_SPOTS
    ]
    sessions = make_sessions(split_blocks(build_blocks(merge_spot_hours(spot_hours))))

    payload = {
        "spot": SPOT_NAME,
        "timezone": TIMEZONE,
        #"profile": PROFILE,
        "generatedAt": datetime.now(ZoneInfo(TIMEZONE)).isoformat(),
        "criteria": {
            "minWindKt": MIN_WIND_KT,
            "goodWindKt": GOOD_WIND_KT,
            "excellentWindKt": EXCELLENT_WIND_KT,
            "maxGustKt": MAX_GUST_KT,
            "maxWaveM": MAX_WAVE_M,
            "minBlockHours": MIN_BLOCK_HOURS,
            "maxBlockHours": MAX_BLOCK_HOURS,
            "ponienteStartHour": PONIENTE_START_HOUR,
            "thermicAloft": THERMIC_USE_80M,
            "windSectors": WIND_SECTORS,
            "spots": [{"name": name, "lat": lat, "lon": lon} for name, lat, lon in FORECAST_SPOTS],
        },
        "sessions": sessions,
    }

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_JSON)), exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_ICS)), exist_ok=True)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_ICS, "w", encoding="utf-8", newline="") as f:
        f.write(make_ics(sessions))

    print(f"Wrote {OUTPUT_JSON} with {len(sessions)} sessions")
    print(f"Wrote {OUTPUT_ICS}")


if __name__ == "__main__":
    main()
