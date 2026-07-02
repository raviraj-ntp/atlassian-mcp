export type FileHit = { path: string; line: number; text: string };

export function matchLines(content: string, path: string, regex: RegExp, limit: number, hits: FileHit[]): number {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (hits.length >= limit) return hits.length;
    if (regex.test(lines[i])) hits.push({ path, line: i + 1, text: lines[i] });
  }
  return hits.length;
}

export function globMatch(path: string, pattern?: string): boolean {
  if (!pattern) return true;
  const re = new RegExp(
    `^${pattern.replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, ".")}$`,
    "i",
  );
  return re.test(path);
}
