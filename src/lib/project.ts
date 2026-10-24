export type Project = {
  slug: string;
  name: string;
  team: string;
  start: string;
  end: string | null;
  type: string;
  contribution: number;
  summary: string;
  stack: string[];
  links: { label: string; url: string }[];
};
// 목록 섬에 넘기는 모양(링크는 쓰지 않는다)
export type Item = Omit<Project, 'links'>;

export const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const href = (slug: string) => `${BASE}${slug}/`;
export const ym = (s: string) => {
  const [y, m] = s.split('.').map(Number);
  return y * 12 + (m - 1);
};
export const period = (p: Pick<Project, 'start' | 'end'>) =>
  p.end === null ? `${p.start} ~ 진행 중` : p.end === p.start ? p.start : `${p.start} ~ ${p.end}`;
export const pct = (p: Pick<Project, 'contribution'>) => Math.round(p.contribution * 100);
// YYYY.MM.DD (timeZone 이 없으면 브라우저 시간대)
export const ymd = (d: Date, timeZone?: string) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(d).replaceAll('-', '.');
