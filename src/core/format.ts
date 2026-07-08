export function fmtBytes(n: number): string {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1048576).toFixed(n < 10485760 ? 2 : 1) + ' MB';
}

// decimals > 0 floors at that precision (never rounds into the next minute) — sub-second
// timecodes exist so zoomed windows keep adjacent sheet cells addressable (spec I2).
export function fmtTime(t: number, decimals = 0): string {
  const f = 10 ** decimals;
  t = Math.floor(Math.max(0, t || 0) * f) / f;
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  const sec = decimals ? s.toFixed(decimals).padStart(3 + decimals, '0') : String(s).padStart(2, '0');
  return m + ':' + sec;
}

// The inverse of fmtTime (spec I3: anything a sheet stamps is a valid input). Accepts plain
// seconds ("90", 67.4) and timecodes ("1:30", "120:30", "01:02:03", "1:07.3"). Two-part
// times are m:ss with UNBOUNDED minutes — fmtTime emits "120:30" for clips over an hour,
// so m:ss vs h:mm:ss is decided by colon count, never by magnitude. Returns NaN if malformed.
export function parseTime(v: number | string): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  const str = v.trim();
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  const parts = str.split(':');
  const sec = parts[parts.length - 1];
  if (!/^\d{1,2}(\.\d+)?$/.test(sec) || parseFloat(sec) >= 60) return NaN;
  if (parts.length === 2 && /^\d+$/.test(parts[0])) {
    return parseInt(parts[0], 10) * 60 + parseFloat(sec);
  }
  if (parts.length === 3 && /^\d+$/.test(parts[0]) && /^\d{1,2}$/.test(parts[1]) && parseInt(parts[1], 10) < 60) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(sec);
  }
  return NaN;
}

export function fmtName(file: { type?: string; name: string }): string {
  const t = (file.type || '').split('/')[1] || (file.name.split('.').pop() || '').toLowerCase();
  return (t || 'IMG').toUpperCase().replace('JPEG', 'JPG');
}
