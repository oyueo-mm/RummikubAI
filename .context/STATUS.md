# RummikubAI — 최신 구현·연구 상태 (2026-11-24)

## 2026-11-24 연구 PR #9 진행

- [PR #9](https://github.com/oyueo-mm/RummikubAI/pull/9): 4개 연구 프로토타입, 학습/검증 스크립트, P4 대안 진단, 원본 seed 관측 누출 방지, GitHub Pages 연구 파일 포함.
- [CI 및 12판 탐색적 대국](https://github.com/oyueo-mm/RummikubAI/actions/runs/45228856235) 성공. 모델 4종을 새로 추가해 전체 **10종**. 학습 후 prior와 UCT 24/PUCT 20회 버전의 승률은 별도 비교 필요.
- 모델 구현 수준은 [RESEARCH_PHASES.md](RESEARCH_PHASES.md)를 따른다. 완전 다층 ISMCTS/ExIt/Deep CFR/ReBeL/MuZero의 구현·성능 우월성 주장 금지.
- 이 문서의 아래 PR #7/#8 배포 증거는 이전 main 기준. **PR #9는 병합 및 새 Pages 결과가 확인된 후에만 완료/배포로 표기**.

## 최신 완료·배포 증거

- `main`에 [PR #7](https://github.com/oyueo-mm/RummikubAI/pull/7) UI 안정화 및 관전 기록 병합(`65bea462`), [CI](https://github.com/oyueo-mm/RummikubAI/actions/runs/45162575812) 성공, [Pages](https://github.com/oyueo-mm/RummikubAI/actions/runs/45162819788) 성공.
- `main`에 [PR #8](https://github.com/oyueo-mm/RummikubAI/pull/8) PlayerObservation·paired bootstrap·시간계측 병합(`1a954bec`), [CI](https://github.com/oyueo-mm/RummikubAI/actions/runs/45163338241) 성공, [Pages](https://github.com/oyueo-mm/RummikubAI/actions/runs/45163717983) 성공.
- 웹: https://oyueo-mm.github.io/RummikubAI/

## 이미 구현됨 (코드·Node 테스트)

- 표준 106개 타일·14개 시작·첫 등록 30점 기반 엔진, 인간 대 AI·같은 기기 인간 2인전, 10개 AI 모델, 랜덤 시드·대국 관전·턴 이동·타일 ID 이벤트, 비교 모드.
- AI 관전 부분 DOM 갱신, 양쪽 손패 기본 공개, 물리 ID별 FLIP 이동 애니메이션 초안; 사람이 뽑은 패 끝 누적 및 명시적 정렬. 정적 및 Node CI 확인 완료.
- `playerObservation(g,p)` 불변 복제·비공개 opponent rack/bag 순서 제외 및 전략 후보 생성 연결. paired seed Bootstrap CI 95%, 모델별 턴 계산시간 측정.
- 자동 CI: Node 테스트, 벤치 대국, 구문 및 사이트 정합성 확인. **실제 브라우저 E2E는 미실시.**

## 미완료·검증 전 (완료 주장 금지)

1. 실브라우저 E2E: 펼쳐진 select와 포커스/스크롤, 재생·일시정지·seek 조합, 모바일 조작, 실제 FLIP 및 소리 타이밍.
2. AI 각 행동 선택·집기·운반·놓기 및 보드 전체 재배열의 단계별 자연스러운 애니메이션.
3. 공식 조커 교체/회수, 더미 고갈과 승패/무승부 등 클래식 룰 판본별 오라클·속성 검증.
4. 순수 합법 행동 API 및 FullState/PlayerObservation 런타임 구조적 완전 분리.
5. 모든 AI에 엄격한 동일 CPU 시간·메모리 제한 부여, 독립 시험 시드 리그.
6. Global Solver 상위 K/최적성 인증, 다층 Belief-ISMCTS/POMCP, 반복 ExIt+정책/가치 신경망, 실제 Deep CFR/ReBeL/MuZero. 현재는 축소/초기 프로토타입만 검증.

## 관측한 성능 (AI 실력 상승 검증 아님)

- 40판 Strategic+ vs Strategic: 24승16패, paired Bootstrap [47.5%,72.5%], 60.0%. 턴 평균 10.90ms vs 5.35ms.
- 이전 독립 200판: Strategic+ vs Strategic 127승73패(63.5%). 동일 계산시간은 아님.
- **외부 2인전 루미큐브 공식 SOTA 기준 미확인.** 세계 최고/이론적 최강 주장 금지.

## 다음 실행

[인수인계](NEXT_CHAT.md) → [남은 일](BACKLOG.md) → [로드맵](ROADMAP_2P_SOTA.md). 브라우저 E2E와 공식 룰, 동등시간 실험 및 전역 솔버 최적성 개선과 다층 신념 탐색을 진행.
