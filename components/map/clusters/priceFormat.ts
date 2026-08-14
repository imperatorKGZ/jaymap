/**
 * Форматирует цену в сомах в компактную подпись отдельного объекта:
 *   4200000  -> "4.2 млн"
 *   890000   -> "890 тыс"
 *   45000    -> "45 тыс"
 *   3200     -> "3 тыс"
 *   500      -> "500 с."
 *
 * Только сомы — валюта не отображается отдельным символом по ТЗ.
 */
export function formatSomPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";

  if (value >= 1_000_000) {
    return `${trimNumber(value / 1_000_000)} млн`;
  }
  if (value >= 1_000) {
    return `${trimNumber(value / 1_000)} тыс`;
  }
  return `${Math.round(value)} с.`;
}

function trimNumber(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
