export function redactSensitiveData(text: string) {
  return text
    .replace(/\b(\d{6})(\d+)(\d{2})\b/g, (_, start, middle, end) => `${start}${"*".repeat(String(middle).length)}${end}`)
    .replace(/https?:\/\/[^\s]+/gi, "[link]");
}
