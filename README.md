# 포트폴리오

김재현 포트폴리오. Astro + React + shadcn/ui + Tailwind v4 정적 사이트.
주소: https://hammerturtle.xyz/portfolio/

## 실행

```sh
pnpm install
pnpm dev          # http://localhost:4321/portfolio/
pnpm build        # dist/ 에 정적 파일
pnpm astro check  # 타입 검사
```

## 배포

`main` 에 push 하면 `.github/workflows/deploy.yml` 이 빌드해 GitHub Pages 로 올린다.
저장소 Settings > Pages 의 Source 를 "GitHub Actions" 로 둔다.

## 프로젝트 추가

`src/content/projects/<slug>.md` 파일 하나를 만든다. slug 가 주소(`/portfolio/<slug>/`)가 된다.
필터 칩(소속, 유형, 기술)과 타임라인 레인은 이 파일들에서 자동으로 만들어진다.
필드가 틀리면 빌드가 실패한다(`src/content.config.ts`).

```md
---
name: "프로젝트 이름"
team: "네오위즈 플랫폼개발1팀" # profile.json 의 teamOrder 와 같은 이름이면 그 순서로 정렬
start: "2026.09"           # YYYY.MM
end: null                  # 진행 중이면 null, 한 달짜리면 start 와 같은 값
type: "신규서비스"          # 유형 칩
contribution: 0.8          # 기여도 0~1
summary: "목록에 보이는 한 줄 설명"
stack: ["TypeScript", "React"]       # 기술 칩. 새 태그는 src/lib/tech.ts 묶음에 넣어야 빌드가 통과(묶음 색)
links:
  - label: "GitHub 저장소"
    url: "https://github.com/..."
---
## 배경 및 목표
...
```

본문은 마크다운. 불릿이 `라벨: 내용` 모양이면 라벨이 굵게 나온다(라벨 30자 이하, 라벨 안에 `:` 없음).
권장 구성: `## 배경 및 목표`, `## 역할`, `## 주요 업무 및 성과`(`### ① ...` 아래 불릿), `## 결과`, `## 회고`.

## 프로필·이력

`src/data/profile.json`: 이름, 소개 3줄(`intro`, 첫 줄이 크게), 링크, 연락처, 경력, 학력, 수상, 기술, 논문, 특허·프로그램 등록, 알고리즘 문제. 기간(`period`)은 `YYYY.MM ~ YYYY.MM`(진행 중이면 `~ 진행 중`)으로 적는다. 섹션 제목 옆 개수(논문 N편 등)는 이 배열 길이로 계산한다.

알고리즘 문제를 더하면 `node scripts/solvedac.mjs` 로 solved.ac 태그·난이도(level)를 채운다(빌드 때는 받지 않는다).

## 목록 주소

필터, 검색, 정렬은 주소에 남아 공유와 뒤로 가기가 된다.
`?team=네오위즈 플랫폼개발1팀&type=신규서비스&tech=TypeScript,Java&q=검색어&sort=contrib`
같은 묶음 안은 OR, 묶음끼리는 AND.
