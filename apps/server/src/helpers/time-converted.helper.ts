export const expiresInToMilliseconds = (expiration: string): number => {
  const regex = /^(\d+)([hmsd])$/;
  const match = expiration.match(regex);

  if (!match) {
    console.error('Invalid expiration format. Use e.g., "1h", "2d", "30m".');
    return 0;
  }

  const value = parseInt(match[1] as string, 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      console.error(
        'Invalid time unit. Use "h" for hours, "m" for minutes, "s" for seconds, or "d" for days.',
      );
      return 0;
  }
};
