type Country = "ES" | "FR" | "DE" | "NL";

type Holiday = {
  countries: Country[];
  name: string;
  excuse: string;
};

const FIXED_HOLIDAYS: Record<string, Holiday> = {
  "01-01": {
    countries: ["ES", "FR", "DE", "NL"],
    name: "New Year's Day",
    excuse: "New year, new excuses — the wind is calling and resolutions can wait.",
  },
  "01-06": {
    countries: ["ES"],
    name: "Epiphany",
    excuse: "Three kings brought gold. You're bringing a 12m and zero meetings.",
  },
  "02-28": {
    countries: ["ES"],
    name: "Andalusia Day",
    excuse: "Andalusia Day — local patriotism requires a session at Valdevaqueros.",
  },
  "04-27": {
    countries: ["NL"],
    name: "King's Day",
    excuse: "King's Day in NL — wear orange, ride Poniente, dodge the tulip FOMO.",
  },
  "05-01": {
    countries: ["ES", "FR", "DE", "NL"],
    name: "Labour Day",
    excuse: "Labour Day across Europe — the only labour today is pumping the kite.",
  },
  "05-05": {
    countries: ["NL"],
    name: "Liberation Day",
    excuse: "Liberation Day — liberate yourself from Slack and hit the water.",
  },
  "05-08": {
    countries: ["FR"],
    name: "Victory Day",
    excuse: "Victory in Europe Day — celebrate with a victory lap on the strap.",
  },
  "07-14": {
    countries: ["FR"],
    name: "Bastille Day",
    excuse: "Bastille Day — storm the beach, not the inbox.",
  },
  "08-15": {
    countries: ["ES", "FR"],
    name: "Assumption",
    excuse: "Assumption Day — assume you'll be on the water by noon.",
  },
  "10-03": {
    countries: ["DE"],
    name: "German Unity Day",
    excuse: "German Unity Day — east wind, west wind, united by one kite session.",
  },
  "10-12": {
    countries: ["ES"],
    name: "Fiesta Nacional",
    excuse: "Spain's national day — national sport: pretending it's a half-day at work.",
  },
  "11-01": {
    countries: ["ES", "FR"],
    name: "All Saints' Day",
    excuse: "All Saints' Day — pray for wind, skip the saints' Zoom stand-up.",
  },
  "11-11": {
    countries: ["FR"],
    name: "Armistice Day",
    excuse: "Armistice Day — armistice signed between you and your calendar.",
  },
  "12-06": {
    countries: ["ES"],
    name: "Constitution Day",
    excuse: "Constitution Day — constitutional right to chase thermals.",
  },
  "12-08": {
    countries: ["ES"],
    name: "Immaculate Conception",
    excuse: "Immaculate Conception — immaculately timed afternoon Poniente.",
  },
  "12-25": {
    countries: ["ES", "FR", "DE", "NL"],
    name: "Christmas",
    excuse: "Christmas — Santa said you've been good. The wind agrees.",
  },
  "12-26": {
    countries: ["DE", "NL"],
    name: "Boxing Day",
    excuse: "Boxing Day — box up the laptop, unwrap a 3-hour session.",
  },
};

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function isoKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthDayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}-${d}`;
}

function movableHolidays(year: number): Record<string, Holiday> {
  const easter = easterSunday(year);
  const addDays = (base: Date, offset: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    return d;
  };

  return {
    [isoKey(addDays(easter, -3))]: {
      countries: ["ES"],
      name: "Maundy Thursday",
      excuse: "Maundy Thursday in Spain — long weekend loading, kite first.",
    },
    [isoKey(addDays(easter, -2))]: {
      countries: ["ES", "FR", "DE", "NL"],
      name: "Good Friday",
      excuse: "Good Friday — good wind, good vibes, questionable OOO message.",
    },
    [isoKey(addDays(easter, 1))]: {
      countries: ["ES", "FR", "DE", "NL"],
      name: "Easter Monday",
      excuse: "Easter Monday — eggs are optional, a downwinder is not.",
    },
    [isoKey(addDays(easter, 39))]: {
      countries: ["FR", "DE", "NL"],
      name: "Ascension Day",
      excuse: "Ascension Day — ascend to cloud nine, literally, on a 9m.",
    },
    [isoKey(addDays(easter, 50))]: {
      countries: ["FR", "DE", "NL"],
      name: "Whit Monday",
      excuse: "Whit Monday — white caps, white kite, white lie to your team chat.",
    },
  };
}

const countryFlags: Record<Country, string> = {
  ES: "🇪🇸",
  FR: "🇫🇷",
  DE: "🇩🇪",
  NL: "🇳🇱",
};

export function getHolidayExcuse(dateInput: string | Date): string | null {
  const date = typeof dateInput === "string" ? new Date(`${dateInput}T12:00:00`) : dateInput;
  const year = date.getFullYear();
  const holiday =
    movableHolidays(year)[isoKey(date)] ??
    FIXED_HOLIDAYS[monthDayKey(date)];

  if (!holiday) return null;

  const flags = holiday.countries.map((c) => countryFlags[c]).join("");
  return `${flags} ${holiday.excuse}`;
}

export function getHolidayLabel(dateInput: string | Date): string | null {
  const date = typeof dateInput === "string" ? new Date(`${dateInput}T12:00:00`) : dateInput;
  const year = date.getFullYear();
  const holiday =
    movableHolidays(year)[isoKey(date)] ??
    FIXED_HOLIDAYS[monthDayKey(date)];

  return holiday ? holiday.name : null;
}
