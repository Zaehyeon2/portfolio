// profile.json 알고리즘 문제 중 tags·level 이 없는 것만 solved.ac 에서 채운다. 빌드 때는 부르지 않는다(CI 에서 막히면 빌드가 깨진다).
// 사용: node scripts/solvedac.mjs
import fs from 'node:fs';

const path = new URL('../src/data/profile.json', import.meta.url);
const profile = JSON.parse(fs.readFileSync(path, 'utf8'));
const idOf = (a) => a.url.match(/(\d+)$/)?.[1];
const todo = profile.algorithms.filter((a) => {
  if (a.tags && a.level) return false;
  if (!idOf(a)) console.log(`문제 번호를 못 찾아 건너뜀: ${a.url}`);
  return idOf(a);
});
if (!todo.length) process.exit(console.log('채울 문제 없음'));
const ids = todo.map(idOf);
const res = await fetch(`https://solved.ac/api/v3/problem/lookup?problemIds=${ids.join(',')}`, { headers: { 'x-solvedac-language': 'ko' } });
if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error(`solved.ac 응답이 JSON 이 아님(${res.status}), 차단됐을 수 있음`);
const byId = new Map((await res.json()).map((p) => [String(p.problemId), p]));
for (const a of todo) {
  const p = byId.get(idOf(a));
  if (!p) continue;
  a.level = p.level;
  a.tags = p.tags.map((t) => (t.displayNames.find((n) => n.language === 'ko') ?? t.displayNames[0]).name);
}
fs.writeFileSync(path, `${JSON.stringify(profile, null, 2)}\n`);
console.log(`채움: ${todo.map((a) => a.title).join(', ')}`);
