const ROTATING_WINDOW_SECONDS = 30;

export const getTimeWindow = (date: Date = new Date()): number => {
  return Math.floor(date.getTime() / 1000 / ROTATING_WINDOW_SECONDS);
};

export const getSecondsUntilNextWindow = (date: Date = new Date()): number => {
  const seconds = Math.floor(date.getTime() / 1000);
  const elapsedInWindow = seconds % ROTATING_WINDOW_SECONDS;
  return ROTATING_WINDOW_SECONDS - elapsedInWindow;
};

export const generateVisualRotatingHash = (sessionId: string, date: Date = new Date()): string => {
  const payload = `${sessionId}:${getTimeWindow(date)}`;
  let hash = 0;

  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8).padStart(8, "0");
};

export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};
