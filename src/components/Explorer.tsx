import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@base-ui/react/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { href, type Item, period, ym, ymd } from '@/lib/project';
import { techStyle } from '@/lib/tech';
import { useGlide } from '@/lib/use-glide';
import { TypeIcon } from '@/lib/project-type';
import Digits from '@/components/Digits';
import { Contrib, TechTags, TypeLabel } from '@/components/ProjectBits';

declare global {
  interface Window {
    // Base.astro 인라인 popstate 가 목록 안 뒤로·앞으로를 가려낼 때 읽는다
    hdList?: { path: string; search: string };
    hdPrefilter?: () => void;
  }
}

type Key = 'team' | 'type' | 'tech';
type Sort = 'new' | 'contrib';
type Filters = Record<Key, Set<string>>;
type State = { f: Filters; q: string; sort: Sort };
type Box = { el: HTMLElement; x: number; y: number; w: number; h: number; l: number; t: number };
type Snap = { rows: Map<string, Box>; chips: Map<string, Box> };

const KEYS: Key[] = ['team', 'type', 'tech'];
const LABEL: Record<Key, string> = { team: '소속', type: '유형', tech: '기술' };
const EASE = 'cubic-bezier(.2,.7,.2,1)';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const empty = (): State => ({ f: { team: new Set(), type: new Set(), tech: new Set() }, q: '', sort: 'new' });
// 주소의 값 중 실제 있는 것만 받는다. 옛 소속 이름(회사 이름 없음, '플랫폼개발팀')은 지금 이름으로 맞춘다.
function readUrl(known: Record<Key, Set<string>>): State {
  const u = new URLSearchParams(location.search);
  const s = empty();
  const norm = (t: string) => t.replace(/^네오위즈 /, '').replace('개발1팀', '개발팀');
  for (const k of KEYS) {
    const vals = (u.get(k) || '').split(',').filter(Boolean);
    const fixed = k === 'team' ? vals.map((v) => [...known.team].find((t) => norm(t) === norm(v)) ?? v) : vals;
    s.f[k] = new Set(fixed.filter((v) => known[k].has(v)));
  }
  s.q = u.get('q') || '';
  s.sort = u.get('sort') === 'contrib' ? 'contrib' : 'new';
  return s;
}
function toQuery(s: State) {
  const u = new URLSearchParams();
  for (const k of KEYS) if (s.f[k].size) u.set(k, [...s.f[k]].join(','));
  if (s.q.trim()) u.set('q', s.q.trim());
  if (s.sort !== 'new') u.set('sort', s.sort);
  const q = u.toString();
  return q ? `?${q}` : '';
}
const val = (p: Item, k: Key) => (k === 'tech' ? p.stack : [p[k]]);
// 검색 대상 글(Base.astro hdPrefilter 도 이 값을 data-text 로 읽는다)
const textOf = (p: Item) => `${p.name} ${p.summary} ${p.stack.join(' ')}`.toLowerCase();
// 상태 하나에 대해 검색어는 한 번만 나눈다. skip 은 그 묶음 조건을 빼고 본다(메뉴 개수).
function matcher(s: State) {
  const words = s.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return (p: Item, skip?: Key) =>
    words.every((w) => textOf(p).includes(w)) && KEYS.every((k) => k === skip || !s.f[k].size || val(p, k).some((v) => s.f[k].has(v)));
}

// 요소 위치를 box 기준으로 잰다(읽기만)
function measure(box: HTMLElement, els: Iterable<HTMLElement>, key: (e: HTMLElement) => string) {
  const b = box.getBoundingClientRect();
  const m = new Map<string, Box>();
  for (const el of els) {
    const r = el.getBoundingClientRect();
    m.set(key(el), { el, x: r.left, y: r.top, w: r.width, h: r.height, l: r.left - b.left, t: r.top - b.top });
  }
  return m;
}
// 남은 것은 옛 자리에서 미끄러지고, 새것은 enter, 빠진 것(React 가 떼어 낸 원래 노드)은 유령 층에서 leave 하고 사라진다
function flip(prev: Map<string, Box>, now: Map<string, Box>, layer: HTMLElement, move: KeyframeAnimationOptions, leave: [Keyframe[], KeyframeAnimationOptions], origin: string, enter?: [Keyframe[], KeyframeAnimationOptions]) {
  for (const [k, n] of now) {
    const p = prev.get(k);
    if (!p) {
      if (enter) n.el.animate(...enter);
      continue;
    }
    const dx = p.x - n.x;
    const dy = p.y - n.y;
    if (dx || dy) n.el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], move);
  }
  for (const [k, p] of prev) {
    if (now.has(k)) continue;
    const el = p.el;
    Object.assign(el.style, { position: 'absolute', left: `${p.l}px`, top: `${p.t}px`, width: `${p.w}px`, height: `${p.h}px`, margin: '0', pointerEvents: 'none', animation: 'none', transformOrigin: origin });
    layer.appendChild(el);
    el.animate(...leave).onfinish = () => el.remove();
  }
}

type Props = {
  projects: Item[];
  teamOrder: string[];
  intro: string[];
  motto: string;
  info: { label: string; text: string; href?: string }[];
  photo: string;
  children?: React.ReactNode;
};

export default function Explorer({ projects, teamOrder, intro, motto, info, photo, children }: Props) {
  const [s, setS] = useState<State>(empty);
  const [now, setNow] = useState<Date | null>(null);
  const [qInput, setQInput] = useState('');
  const [techQ, setTechQ] = useState('');
  const resRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const pickRef = useRef<HTMLDivElement>(null);
  const chipGhostRef = useRef<HTMLDivElement>(null);
  const snap = useRef<Snap | null>(null);

  const teamIdx = (t: string) => {
    const i = teamOrder.indexOf(t);
    return i < 0 ? 99 : i;
  };
  const teams = useMemo(() => [...new Set(projects.map((p) => p.team))].sort((a, b) => teamIdx(a) - teamIdx(b)), [projects]);
  const known = useMemo(() => Object.fromEntries(KEYS.map((k) => [k, new Set(projects.flatMap((p) => val(p, k)))])) as Record<Key, Set<string>>, [projects]);
  // 검색 입력 debounce 가 그사이 바뀐 필터를 덮어쓰지 않게 최신 상태를 읽는다
  const sRef = useRef(s);
  sRef.current = s;
  // 칩·검색어를 지운 뒤 포커스: 같은 자리 칩 ×, 없으면 앞 칩 ×, 없으면 검색칸(-1)
  const refocus = useRef<number | null>(null);
  // 메뉴가 열려 있는 동안은 연 순간의 순서를 지킨다(체크할 때마다 항목이 자리를 옮기지 않게)
  const [frozen, setFrozen] = useState<Partial<Record<Key, string[]>>>({});
  const match = useMemo(() => matcher(s), [s]);

  const rowEls = () => resRef.current!.querySelectorAll<HTMLElement>('.row');
  const chipEls = () => pickRef.current!.querySelectorAll<HTMLElement>(':scope > [data-k]');
  // 상태를 바꾸기 직전 줄·칩 위치를 찍어 두면 다음 그림에서 FLIP 으로 옮긴다.
  function snapshot() {
    if (!resRef.current || reduced()) return;
    snap.current = { rows: measure(resRef.current, rowEls(), (e) => e.dataset.slug!), chips: measure(pickRef.current!, chipEls(), (e) => e.dataset.k!) };
  }
  function change(next: State, replace = false) {
    snapshot();
    setS(next);
    history[replace ? 'replaceState' : 'pushState'](history.state, '', toQuery(next) || location.pathname);
  }
  // 주소에서 상태를 읽는다(처음, 목록 안 뒤로·앞으로)
  function load() {
    const st = readUrl(known);
    setS(st);
    setQInput(st.q);
    return st;
  }

  useEffect(() => {
    const q = toQuery(load());
    if (q !== location.search) history.replaceState(history.state, '', (q || location.pathname) + location.hash);
    setNow(new Date());
    window.hdList = { path: location.pathname, search: location.search };
    // 상세의 "프로젝트 목록" 링크가 이 기록으로 뒤로 갈지 정한다(Astro 이동마다 history.state.index 가 1씩 는다).
    sessionStorage.setItem('listIndex', String(history.state?.index ?? ''));
    const onSwap = () => (window.hdList = undefined);
    document.addEventListener('astro:before-swap', onSwap);
    // Base.astro 의 인라인 popstate 가 목록 안 뒤로·앞으로(쿼리만 바뀜)를 Astro 보다 먼저 받아 넘겨 준다.
    const onPop = () => {
      if (!resRef.current?.isConnected) return;
      snapshot();
      load();
    };
    addEventListener('hd:list-pop', onPop);
    return () => {
      removeEventListener('hd:list-pop', onPop);
      document.removeEventListener('astro:before-swap', onSwap);
    };
  }, []);

  // 지금 주소를 기억한다: 상세의 '프로젝트 목록' 링크, 인라인 popstate 의 비교값
  useEffect(() => {
    if (!now) return;
    sessionStorage.setItem('listQuery', toQuery(s));
    if (window.hdList) window.hdList.search = location.search;
  }, [s, now]);

  useEffect(() => {
    if (qInput === s.q) return;
    const t = setTimeout(() => change({ ...sRef.current, q: qInput }, true), 150);
    return () => clearTimeout(t);
  }, [qInput]);

  const vis = useMemo(
    () =>
      projects
        .filter((p) => match(p))
        .sort(
          s.sort === 'contrib'
            ? (a, b) => b.contribution - a.contribution || ym(b.start) - ym(a.start)
            : (a, b) => ym(b.start) - ym(a.start) || (b.end === null ? 1e9 : ym(b.end)) - (a.end === null ? 1e9 : ym(a.end)),
        ),
    [projects, match, s.sort],
  );
  const active = KEYS.reduce((n, k) => n + s.f[k].size, 0) + (s.q.trim() ? 1 : 0);

  // Base.astro 가 hydration 전에 쿼리대로 숨겨 둔 줄·묶음(pre)과 순서(order)를 섬이 그린 뒤 걷는다
  useLayoutEffect(() => {
    if (!now) return;
    for (const e of document.querySelectorAll<HTMLElement>('#res .pre')) e.classList.remove('pre');
    for (const e of document.querySelectorAll<HTMLElement>('#res .row')) e.style.order = '';
  }, [now]);

  useEffect(() => {
    const i = refocus.current;
    if (i === null) return;
    refocus.current = null;
    const btns = pickRef.current?.querySelectorAll<HTMLElement>(':scope > .pk button') ?? [];
    (btns[i] ?? btns[i - 1] ?? document.querySelector<HTMLElement>('.search input'))?.focus();
  });

  useLayoutEffect(() => {
    const o = snap.current;
    snap.current = null;
    if (!o || !resRef.current) return;
    const rows = measure(resRef.current, rowEls(), (e) => e.dataset.slug!);
    const chips = measure(pickRef.current!, chipEls(), (e) => e.dataset.k!);
    const opt: KeyframeAnimationOptions = { duration: 300, easing: EASE, fill: 'both' };
    flip(o.rows, rows, ghostRef.current!, opt, [[{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scaleY(.85)' }], { duration: 240, easing: 'ease-out', fill: 'forwards' }], 'top', [
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { ...opt, duration: 320, delay: 80 },
    ]);
    // 고른 값 칩: 새 칩은 CSS(chip-in)가 맡는다
    flip(o.chips, chips, chipGhostRef.current!, { duration: 220, easing: EASE }, [[{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.85)' }], { duration: 150, easing: 'ease-in', fill: 'forwards' }], 'center');
  });

  const toggle = (k: Key, v: string) => {
    const f = { ...s.f, [k]: new Set(s.f[k]) };
    f[k].has(v) ? f[k].delete(v) : f[k].add(v);
    change({ ...s, f });
  };
  const clear = () => {
    refocus.current = -1;
    setQInput('');
    change({ ...empty(), sort: s.sort });
  };
  // 지운 칩의 자리(같은 자리에 다음 칩이 온다)
  const chipIndex = (btn: HTMLElement) => [...pickRef.current!.querySelectorAll(':scope > .pk')].indexOf(btn.parentElement!);

  function menu(k: Key) {
    const n = new Map<string, number>();
    for (const p of projects) for (const v of val(p, k)) n.set(v, 0);
    for (const p of projects) if (match(p, k)) for (const v of val(p, k)) n.set(v, n.get(v)! + 1);
    let list = [...n];
    const order = frozen[k];
    if (order) list.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    else if (k === 'team') list.sort((a, b) => teamIdx(a[0]) - teamIdx(b[0]));
    else list.sort((a, b) => Number(s.f[k].has(b[0])) - Number(s.f[k].has(a[0])) || b[1] - a[1] || a[0].localeCompare(b[0]));
    const freeze = (o: boolean) => setFrozen((f) => ({ ...f, [k]: o ? list.map(([v]) => v) : undefined }));
    const q = k === 'tech' ? techQ.trim().toLowerCase() : '';
    if (q) list = list.filter(([v]) => v.toLowerCase().includes(q));
    const sel = s.f[k].size;
    return (
      <Popover
        key={k}
        onOpenChange={(o) => {
          freeze(o);
          if (!o) setTechQ('');
        }}
      >
        <PopoverTrigger className={`ddb${sel ? ' on' : ''}`}>
          {LABEL[k]}
          <b className={sel ? undefined : 'nil'} aria-hidden={!sel} aria-label={sel ? `${sel}개 선택` : undefined}>
            <Digits value={sel} />
          </b>
        </PopoverTrigger>
        <PopoverContent align={k === 'tech' ? 'end' : 'start'} className="pop" aria-label={`${LABEL[k]} 필터`}>
          {k === 'tech' && (
            <Input className="ps" placeholder="기술 검색" aria-label="기술 검색" value={techQ} onChange={(e) => setTechQ(e.target.value)} />
          )}
          <GlideList>
            {list.map(([v, c]) => {
              const on = s.f[k].has(v);
              return (
                <li key={v}>
                  <label data-row className={`ck${c === 0 && !on ? ' zero' : ''}`}>
                    <Checkbox.Root className="sc" checked={on} onCheckedChange={() => toggle(k, v)}>
                      <span className="sc-fill" />
                      <svg className="sc-tick" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5.5 12.5l4.5 4.5 8.5-9.5" pathLength={1} />
                      </svg>
                    </Checkbox.Root>
                    <span className="v">
                      {k === 'type' && <TypeIcon type={v} />}
                      {v}
                    </span>
                    <small aria-hidden="true">{c}</small>
                    <span className="sr-only">{c}개</span>
                  </label>
                </li>
              );
            })}
            {list.length === 0 && <li className="none">맞는 기술이 없어요</li>}
          </GlideList>
          {sel > 0 && (
            <div className="pf">
              <span>{sel}개 선택</span>
              <button type="button" onClick={() => change({ ...s, f: { ...s.f, [k]: new Set() } })}>
                선택 해제
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  // 타임라인 배치는 날짜가 정해지면 한 번만 계산한다(필터는 막대 dim 만 바꾼다)
  const layout = useMemo(() => {
    if (!now) return null;
    const nowYm = now.getFullYear() * 12 + now.getMonth();
    // 오른쪽 끝 = 오늘(달 안의 날짜까지). 진행 중·이번 달에 끝나는 막대도 오늘에서 끊긴다.
    const E = nowYm + (now.getDate() - 1) / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const S = Math.min(...projects.map((p) => ym(p.start))) - 1;
    const x = (m: number) => ((m - S) / (E - S)) * 100;
    const years: { y: number; left: number }[] = [];
    for (let y = Math.ceil((S + 1) / 12); y * 12 < E; y++) years.push({ y, left: x(y * 12) });
    let i = 0;
    const lanes = teams.map((t) => {
      const rows: number[] = [];
      const bars = projects
        .filter((p) => p.team === t)
        .sort((a, b) => ym(a.start) - ym(b.start))
        .map((p) => {
          const a = ym(p.start);
          const b = Math.min((p.end === null ? nowYm : ym(p.end)) + 1, E);
          let r = rows.findIndex((e) => e <= a);
          if (r < 0) r = rows.push(0) - 1;
          rows[r] = b + 0.3;
          return { p, i: i++, left: x(a), width: x(b) - x(a), top: r * 14 + 6 };
        });
      return { t, h: rows.length * 14 + 12, bars };
    });
    return { years, lanes, today: ymd(now) };
  }, [now, projects, teams]);

  function timeline() {
    if (!layout) return <div className="tl" aria-hidden="true" style={{ height: 46 + teams.length * 40 }} />;
    return (
      <div className="tl" style={{ '--n': projects.length } as React.CSSProperties} role="group" aria-label="프로젝트 타임라인">
        <div className="tg">
          <div className="gr">
            {layout.years.map(({ y, left }) => (
              <div className="yl" key={y} style={{ left: `${left}%` }}>
                <span>{y}</span>
              </div>
            ))}
            <div className="now" style={{ left: '100%' }}>
              <span>{layout.today}</span>
            </div>
          </div>
          {layout.lanes.map(({ t, h, bars }) => (
            <div key={t} className={`lane t${teamOrder.indexOf(t)}`} style={{ '--h': `${h}px` } as React.CSSProperties}>
              <span className="ln">{t}</span>
              <div className="lt">
                {bars.map(({ p, i, left, width, top }) => {
                  const label = `${p.name}  ${period(p)}`;
                  return (
                    <Tooltip key={p.slug}>
                      <TooltipTrigger
                        render={
                          <a
                            href={href(p.slug)}
                            className={`bar${p.end === null ? ' open' : ''}${match(p) ? '' : ' dim'}`}
                            tabIndex={-1}
                            aria-label={label}
                            style={{ '--i': i, left: `${left}%`, width: `${width}%`, top } as React.CSSProperties}
                          />
                        }
                      />
                      <TooltipContent className="tip">{label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 결과 목록은 검색 입력(qInput)·기술 검색(techQ) 타자마다 다시 그리지 않는다
  const results = useMemo(() => {
    const groups = teams.map((t) => [t, vis.filter((p) => p.team === t)] as const).filter(([, a]) => a.length);
    if (!groups.length)
      return (
        <div className="empty">
          <p>조건에 맞는 프로젝트가 없어요.</p>
          <Button variant="outline" className="clear" onClick={clear}>
            필터 해제
          </Button>
        </div>
      );
    return (
      <>
        <p className="count" aria-hidden="true">
          <Digits value={vis.length} />개 프로젝트
        </p>
        <div className="head">
          <span>프로젝트</span>
          <span>기간</span>
          <span>기술</span>
          <span>기여도</span>
        </div>
        {groups.map(([t, a]) => (
          <section className={`grp t${teamOrder.indexOf(t)}`} key={t}>
            <h3>
              {t}
              <small>{a.length}개</small>
            </h3>
            <ul>
              {a.map((p) => (
                <li
                  className="row"
                  data-slug={p.slug}
                  key={p.slug}
                  data-team={p.team}
                  data-type={p.type}
                  data-tech={p.stack.join('|')}
                  data-text={textOf(p)}
                  data-c={p.contribution}
                  data-s={ym(p.start)}
                >
                  <div className="nm">
                    <a href={href(p.slug)}>
                      <span className="nmt">{p.name}</span>
                      <svg className="lm" viewBox="0 0 16 16" aria-hidden="true">
                        <path className="arm up" d="M6 4L10 8" />
                        <path className="arm dn" d="M10 8L6 12" />
                      </svg>
                    </a>
                    <p>{p.summary}</p>
                  </div>
                  <div className="pd">
                    {period(p)}
                    <small className="ty">
                      <TypeLabel type={p.type} />
                    </small>
                  </div>
                  <div className="stk">
                    <TechTags stack={p.stack} />
                  </div>
                  <div className="ct">
                    <Contrib p={p} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  }, [vis, teams]);

  return (
    <TooltipProvider delay={80} closeDelay={0}>
      <section className="intro">
        <div className="me">
          <img className="photo" src={photo} alt="김재현" width={120} height={154} />
          <dl className="info" aria-label="기본 정보">
            {info.map((it) => (
              <div key={it.label}>
                <dt>{it.label}</dt>
                <dd>{it.href ? <a href={it.href}>{it.text}</a> : it.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="text">
          {intro.map((t, i) =>
            i ? (
              <p key={t}>{t}</p>
            ) : (
              <h1 key={t} className="lead">
                {t}
              </h1>
            ),
          )}
          <p className="motto">{motto}</p>
        </div>
      </section>
      {children}
      <div className="grp" id="projects">
        <h2>
          프로젝트<small>{projects.length}개</small>
        </h2>
      </div>
      {timeline()}
      <section className="tools">
        <label className="search">
          <span className="sr-only">검색</span>
          <Input type="search" placeholder="이름, 설명, 기술로 검색" value={qInput} onChange={(e) => setQInput(e.target.value)} autoComplete="off" />
        </label>
        <div className="menus">
          {KEYS.map(menu)}
          <SortMenu value={s.sort} onChange={(v) => change({ ...s, sort: v })} />
        </div>
      </section>
      <div className="picked" ref={pickRef}>
        <div className="ghosts" ref={chipGhostRef} aria-hidden="true" />
        {active === 0 && (
          <span className="hint" data-k="hint">
            필터를 고르면 여기 표시돼요
          </span>
        )}
        {KEYS.flatMap((k) =>
          [...s.f[k]].map((v) => (
            <span className={`pk${k === 'team' ? ` team t${teamOrder.indexOf(v)}` : ''}`} key={k + v} data-k={k + v} style={k === 'tech' ? techStyle(v) : undefined}>
              {k === 'type' && <TypeIcon type={v} />}
              {v}
              <button
                type="button"
                aria-label={`${v} 해제`}
                onClick={(e) => {
                  refocus.current = chipIndex(e.currentTarget);
                  toggle(k, v);
                }}
              >
                ×
              </button>
            </span>
          )),
        )}
        {s.q.trim() && (
          <span className="pk" data-k="q">
            검색: {s.q.trim()}
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={(e) => {
                refocus.current = chipIndex(e.currentTarget);
                setQInput('');
                change({ ...s, q: '' }, true);
              }}
            >
              ×
            </button>
          </span>
        )}
        {active > 0 && (
          <Button variant="link" className="clear" data-k="clear" onClick={clear}>
            전체 해제
          </Button>
        )}
      </div>
      <p className="sr-only" role="status">
        {vis.length ? `${vis.length}개 프로젝트` : '조건에 맞는 프로젝트가 없어요'}
      </p>
      <div id="res" ref={resRef}>
        <div className="ghosts" ref={ghostRef} aria-hidden="true" />
        {results}
      </div>
    </TooltipProvider>
  );
}

function GlideList({ children }: { children: React.ReactNode }) {
  const { pill, handlers } = useGlide();
  return (
    <ul className="glide" {...handlers}>
      <span className="gpill" ref={pill} aria-hidden="true" />
      {children}
    </ul>
  );
}

const SORTS: { value: Sort; label: string }[] = [
  { value: 'new', label: '최신순' },
  { value: 'contrib', label: '기여도순' },
];

function SortMenu({ value, onChange }: { value: Sort; onChange: (v: Sort) => void }) {
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(0);
  const [kb, setKb] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const { pill, move, handlers } = useGlide();
  const cur = SORTS.findIndex((o) => o.value === value);
  const go = (i: number) => {
    setAct(i);
    move(list.current?.querySelectorAll('[data-row]')[i]);
  };
  const pick = (v: Sort) => {
    if (v !== value) onChange(v);
    setOpen(false);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setAct(cur);
      }}
    >
      <PopoverTrigger
        className="ddb sortb"
        aria-haspopup="listbox"
        onPointerDown={() => setKb(false)}
        onKeyDown={(e) => ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key) && setKb(true)}
      >
        <span className="mut">정렬</span>
        {/* 두 글자를 겹쳐 두어 고른 값이 바뀌어도 버튼 폭이 그대로다 */}
        <span className="gv">
          {SORTS.map((o) => (
            <span key={o.value + (o.value === value ? '1' : '0')} className={o.value === value ? 'on' : undefined} aria-hidden={o.value !== value}>
              {o.label}
            </span>
          ))}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="pop sortp" initialFocus={list} aria-label="정렬">
        <ul
          ref={list}
          role="listbox"
          aria-label="정렬"
          tabIndex={0}
          aria-activedescendant={`sort-${SORTS[act].value}`}
          className={`glide${kb ? ' kb' : ''}`}
          {...handlers}
          onFocus={() => go(act)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setKb(true);
              go((act + (e.key === 'ArrowDown' ? 1 : SORTS.length - 1)) % SORTS.length);
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              pick(SORTS[act].value);
            }
          }}
        >
          <span className="gpill" ref={pill} aria-hidden="true" />
          {SORTS.map((o, i) => (
            <li
              key={o.value}
              id={`sort-${o.value}`}
              role="option"
              aria-selected={o.value === value}
              data-row
              className="opt"
              onPointerEnter={() => setAct(i)}
              onClick={() => pick(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
