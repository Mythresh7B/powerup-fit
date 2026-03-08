export function getLevelColour(level: number): string {
  if (level >= 20) return '#F59E0B';
  if (level >= 15) return '#F59E0B';
  if (level >= 10) return '#7C3AED';
  if (level >= 5) return '#3B82F6';
  return '#9CA3AF';
}

export function isAnimatedLevel(level: number): boolean {
  return level >= 20;
}
