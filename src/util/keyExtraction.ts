export function extractJiraKeys(text: string): string[] {
  const matches = text.match(/\b[A-Z][A-Z0-9]+-\d+\b/g) ?? [];
  return [...new Set(matches)];
}

export function extractPrRefs(text: string): Array<{ project: string; repo: string; id: number }> {
  const out: Array<{ project: string; repo: string; id: number }> = [];
  const re = /\/projects\/([^/]+)\/repos\/([^/]+)\/pull-requests\/(\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ project: m[1], repo: m[2], id: Number(m[3]) });
  }
  return out;
}
