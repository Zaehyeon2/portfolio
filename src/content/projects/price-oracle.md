---
name: "Price Oracle"
team: "네오위즈 블록체인Lab"
start: "2023.05"
end: "2023.06"
type: "신규서비스"
contribution: 0.6
summary: "주기적으로 토큰 가격 데이터를 수집·정제하여 온체인 스마트 컨트랙트에 기록하는 독립형 오라클 시스템"
stack: ["Solidity","Nest.js","TypeScript","ECS","CDKTF"]
links:
  - label: "Price Oracle 컨트랙트"
    url: "https://polygonscan.com/address/0x6c7c3549E8729CB4A91e6527650043DC324F14f9"
---
## 배경 및 목표

블록체인 네트워크 내부(Smart Contract)에서 외부 API(CoinMarketCap)와 직접 통신할 수 없는 기술적 제약 존재.

→ 이를 해결하기 위해 주기적으로 토큰 가격 데이터를 수집·정제하여 온체인 스마트 컨트랙트에 기록하는 독립형 오라클 시스템 개발을 목표로 함.

## 역할

시스템 구조 설계 참여 및 주도적 개발

## 주요 업무 및 성과

### ① 스마트 컨트랙트 (Price Oracle Contract) 개발

- 토큰 주소(Address), 가격(Price), 소수점 자리수(Decimals), 요청 시간(RequestedAt)을 안전하게 기록하고 조회할 수 있는 온체인 데이터 구조 설계.

### ② 오라클 데이터 피드 서비스 개발 (Nest.js)

- 외부 데이터 연동: CoinMarketCap API를 활용해 화이트리스트에 등록된 토큰들의 가격 데이터를 안정적으로 파싱.
- DEX 라우팅 연산: CMC API에 존재하지 않는 비상장 토큰의 경우, 탈중앙화 거래소(DEX)의 유동성 풀을 탐색하는 라우팅 알고리즘을 구현하여 실시간 가치 산출 로직 최적화.
- 자동화 스케줄링: Nest.js CronJob을 도입하여 30분 주기로 데이터를 자동 수집 및 정제하고, 온체인 업데이트 트랜잭션을 발행하는 파이프라인 구축.

## 결과

실세계 자산(RWA) 및 토큰 가격 정보가 필요한 사내 타 스마트 컨트랙트들의 신뢰할 수 있는 원천 데이터(Single Source of Truth)로 활용됨.

## 회고

스마트 컨트랙트 작업을 넘어 처음으로 Nest.js 기반의 백엔드 인프라 서비스를 구축했다. 비록 외부 트래픽이 직접 유입되는 서버는 아니었지만, 주기적인 배치 작업(CronJob)의 예외 처리와 외부 API 지연 시의 예외 대책 등 서버 관점에서 고려해야 할 데이터 무결성과 안정성을 깊이 있게 고민해 본 뜻깊은 프로젝트였다.
