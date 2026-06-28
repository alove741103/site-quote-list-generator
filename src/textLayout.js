const DEFAULT_PUNCTUATION_ORDER = ['。', '；', '、', '，'];
const DEFAULT_READABLE_WRAP_CHARS = 38;
const DEFAULT_BULLET_CONTINUATION_INDENT = '   ';

function visibleLength(text) {
  return Array.from(String(text || '')).length;
}

function splitByPreferredPunctuation(text) {
  const source = String(text || '').trim();
  if (!source) return [];

  const parts = [];
  let current = '';
  Array.from(source).forEach((char) => {
    current += char;
    if (DEFAULT_PUNCTUATION_ORDER.includes(char)) {
      parts.push(current);
      current = '';
    }
  });
  if (current) parts.push(current);
  return parts.reduce((merged, part, index) => {
    const shouldJoinNext = part.endsWith('、') && visibleLength(part) <= 4 && parts[index + 1];
    if (shouldJoinNext) {
      merged.push(`${part}${parts[index + 1]}`);
      parts[index + 1] = '';
      return merged;
    }
    if (part) merged.push(part);
    return merged;
  }, []);
}

function hardSplitReadable(text, maxChars) {
  const chars = Array.from(String(text || ''));
  const chunks = [];
  for (let index = 0; index < chars.length; index += maxChars) {
    chunks.push(chars.slice(index, index + maxChars).join(''));
  }
  return chunks;
}

function splitByMeasuredWidth(text, measure, maxWidth) {
  const chars = Array.from(String(text || ''));
  const chunks = [];
  let current = '';
  chars.forEach((char) => {
    const next = `${current}${char}`;
    if (!current || measure(next) <= maxWidth) {
      current = next;
      return;
    }
    chunks.push(current);
    current = char;
  });
  if (current) chunks.push(current);
  return chunks;
}

export function wrapReadableTextByWidth(text, options = {}) {
  const measure = options.measure || ((value) => visibleLength(value));
  const maxWidth = Math.max(1, options.maxWidth || 1);
  const continuationIndent = options.continuationIndent ?? DEFAULT_BULLET_CONTINUATION_INDENT;
  const lines = String(text || '').replace(/\r/g, '').split('\n');

  return lines.flatMap((rawLine) => {
    const line = rawLine.trim();
    if (!line) return [''];

    const bulletMatch = line.match(/^([•*]\s*)/);
    const firstPrefix = bulletMatch ? '• ' : '';
    const nextPrefix = bulletMatch ? continuationIndent : '';
    const body = bulletMatch ? line.replace(/^([•*]\s*)/, '').trim() : line;
    const segments = splitByPreferredPunctuation(body);
    const output = [];
    let current = '';

    segments.forEach((segment) => {
      const prefix = output.length ? nextPrefix : firstPrefix;
      const candidate = `${current}${segment}`;
      if (!current || measure(`${prefix}${candidate}`) <= maxWidth) {
        current = candidate;
        return;
      }

      output.push(current);
      const continuationWidth = Math.max(1, maxWidth - measure(nextPrefix));
      if (measure(`${nextPrefix}${segment}`) <= maxWidth) {
        current = segment;
        return;
      }

      const split = splitByMeasuredWidth(segment, measure, continuationWidth);
      output.push(...split.slice(0, -1));
      current = split.at(-1) || '';
    });

    if (current) output.push(current);
    return output.map((part, index) => `${index === 0 ? firstPrefix : nextPrefix}${part}`);
  });
}

export function wrapReadableText(text, options = {}) {
  const maxChars = Math.max(12, options.maxChars || DEFAULT_READABLE_WRAP_CHARS);
  const continuationIndent = options.continuationIndent ?? DEFAULT_BULLET_CONTINUATION_INDENT;
  const lines = String(text || '').replace(/\r/g, '').split('\n');

  return lines.flatMap((rawLine) => {
    const line = rawLine.trim();
    if (!line) return [''];

    const bulletMatch = line.match(/^([•*]\s*)/);
    const firstPrefix = bulletMatch ? '• ' : '';
    const nextPrefix = bulletMatch ? continuationIndent : '';
    const body = bulletMatch ? line.replace(/^([•*]\s*)/, '').trim() : line;
    const limit = Math.max(8, maxChars - visibleLength(firstPrefix));
    const continuationLimit = Math.max(8, maxChars - visibleLength(nextPrefix));
    const segments = splitByPreferredPunctuation(body);
    const output = [];
    let current = '';

    segments.forEach((segment) => {
      const activeLimit = output.length ? continuationLimit : limit;
      const candidate = `${current}${segment}`;
      if (!current || visibleLength(candidate) <= activeLimit) {
        current = candidate;
        return;
      }

      output.push(current);
      if (visibleLength(segment) <= continuationLimit) {
        current = segment;
        return;
      }

      const split = hardSplitReadable(segment, continuationLimit);
      output.push(...split.slice(0, -1));
      current = split.at(-1) || '';
    });

    if (current) output.push(current);
    return output.map((part, index) => `${index === 0 ? firstPrefix : nextPrefix}${part}`);
  });
}

export function formatParagraphForOutput(text, options = {}) {
  const clean = String(text || '')
    .replace(/^\s*[•*]\s*/, '')
    .trim();
  if (!clean) return '';
  return `• ${clean}`;
}
