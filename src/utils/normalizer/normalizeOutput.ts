export function normalize(output: string): string {
  return output.replace(/\s+/g, '').toLowerCase();
}
