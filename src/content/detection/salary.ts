const UNIT_LABELS: Record<string, string> = {
  HOUR: 'per hour',
  DAY: 'per day',
  WEEK: 'per week',
  MONTH: 'per month',
  YEAR: 'per year',
};

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };

function formatNumber(value: unknown): string {
  const number = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(number) || number <= 0) return '';
  return number.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** schema.org baseSalary (MonetaryAmount / QuantitativeValue / number / string) → readable string. */
export function formatBaseSalary(raw: unknown): string {
  try {
    if (raw == null) return '';
    if (typeof raw === 'string') return raw.trim().slice(0, 120);
    if (typeof raw === 'number') return formatNumber(raw);
    if (Array.isArray(raw)) return formatBaseSalary(raw[0]);
    if (typeof raw !== 'object') return '';
    const salary = raw as Record<string, unknown>;
    const currency = typeof salary.currency === 'string' ? salary.currency.toUpperCase() : '';
    const value = salary.value;
    let min = '';
    let max = '';
    let exact = '';
    let unit = typeof salary.unitText === 'string' ? salary.unitText : '';
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const quant = value as Record<string, unknown>;
      min = formatNumber(quant.minValue);
      max = formatNumber(quant.maxValue);
      exact = formatNumber(quant.value);
      if (typeof quant.unitText === 'string') unit = quant.unitText;
    } else {
      exact = formatNumber(value);
      min = formatNumber(salary.minValue);
      max = formatNumber(salary.maxValue);
    }
    const symbol = CURRENCY_SYMBOLS[currency] ?? '';
    const money = (amount: string): string => (symbol ? `${symbol}${amount}` : amount);
    let text = '';
    if (min && max && min !== max) text = `${money(min)} – ${money(max)}`;
    else if (min || max || exact) text = money(exact || min || max);
    if (!text) return '';
    if (currency && !symbol) text = `${text} ${currency}`;
    const unitLabel = UNIT_LABELS[unit.toUpperCase()] ?? (unit ? `per ${unit.toLowerCase()}` : '');
    return unitLabel ? `${text} ${unitLabel}` : text;
  } catch {
    return '';
  }
}

const CURRENCY = '(?:[$€£¥₹]|USD|EUR|GBP|CAD|AUD|CHF|INR|SEK|NOK|DKK)';
const AMOUNT = '\\d{1,3}(?:[,.\\s]\\d{3})*(?:\\.\\d+)?\\s?[kK]?';
const SALARY_RE = new RegExp(
  `${CURRENCY}\\s?${AMOUNT}(?:\\s*(?:-|–|—|to)\\s*${CURRENCY}?\\s?${AMOUNT})?(?:\\s*${CURRENCY})?(?:\\s*(?:\\/|per|a|an)\\s*(?:year|yr|annum|hour|hr|month|mo|week|day))?`,
  'i',
);

/** Finds a salary-looking amount in text (currency + number, optional range and unit). */
export function findSalary(text: string): string {
  const match = SALARY_RE.exec(text ?? '');
  if (!match) return '';
  const value = match[0].trim();
  // A lone small amount ("$5") is not a salary.
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length < 2 && !/k/i.test(value)) return '';
  return value;
}
