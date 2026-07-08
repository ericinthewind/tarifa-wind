import type { Forecast } from "./types";

const now = new Date();
const start = new Date(now);
start.setHours(10, 0, 0, 0);
const end = new Date(now);
end.setHours(15, 0, 0, 0);

export const sampleForecast: Forecast = {
  spot: "Tarifa",
  timezone: "Europe/Madrid",
  profile: "kite",
  generatedAt: new Date().toISOString(),
  criteria: {},
  sessions: [
    {
      id: "sample-1",
      start: start.toISOString(),
      end: end.toISOString(),
      date: start.toISOString().slice(0, 10),
      startTime: "10:00",
      endTime: "15:00",
      title: "🟢 Excellent Levante: 25 kt · score 91",
      quality: "Excellent",
      emoji: "🟢",
      windLabel: "Levante",
      windArrow: "→",
      avgWindKt: 25,
      maxGustKt: 32,
      directionDeg: 90,
      compass: "E",
      maxWaveM: 0.9,
      avgPeriodS: 6,
      score: 91,
      durationHours: 5,
      description: "Sample session",
    },
  ],
};
