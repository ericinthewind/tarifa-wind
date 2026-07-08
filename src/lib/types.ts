export type SessionQuality = "Excellent" | "Good" | "Worth it";

export type WindSession = {
  id: string;
  start: string;
  end: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  quality: SessionQuality;
  emoji: string;
  windLabel: string;
  windArrow: string;
  avgWindKt: number;
  maxGustKt: number;
  directionDeg: number;
  compass: string;
  maxWaveM: number;
  avgPeriodS: number;
  score: number;
  durationHours: number;
  description: string;
};

export type Forecast = {
  spot: string;
  timezone: string;
  profile: string;
  generatedAt: string;
  criteria: Record<string, string | number>;
  sessions: WindSession[];
};
