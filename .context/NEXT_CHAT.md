# RummikubAI — 새 채팅 인수인계 (2026-11-23 최신)

> 다음 채팅에서는 이 문서를 먼저 읽고, 이후 `STATUS.md`, `BACKLOG.md`, `ROADMAP_2P_SOTA.md`, `AI_RESEARCH.md`, `DECISIONS.md`, `AGENTS.md`를 확인한다. 19:53 이전의 상태·체크리스트 서술과 충돌하면 **아래 검증 완료 상태**를 우선한다.

## 목표

- **표준 2인전 루미큐브 AI의 최종 승률 최대화 및 검증 가능한 SOTA급 연구.** 외부 표준 SOTA 기준은 미확인; 현재 AI가 SOTA라는 표현은 금지.
- 타일 106개, 첫 손패 14개, 첫 등록 30점. 실제 공식 조커 회수/교체·더미 고갈 등 상세 판본 검증은 미완료.
- 3~4인·온라인 매칭은 우선 범위 밖. 사람 2인 플레이는 동일 기기 로컬 교대.

## 2026-11-23 이번 채팅에서 실제 병합·배포한 변경

| 항목 | 상태 및 증거 |
| --- | --- |
| PR #7 UI/관전 수정 | **병합** `65bea462`, [PR #7](https://github.com/oyueo-mm/RummikubAI/pull/7), [PR CI 성공](https://github.com/oyueo-mm/RummikubAI/actions/runs/45162575812), [Pages 성공](https://github.com/oyueo-mm/RummikubAI/actions/runs/45162819788) |
| PR #8 AI 관측·벤치마크 | **병합** `1a954bec`, [PR #8](https://github.com/oyueo-mm/RummikubAI/pull/8), [PR CI 성공](https://github.com/oyueo-mm/RummikubAI/actions/runs/45163338241), [Pages 성공](https://github.com/oyueo-mm/RummikubAI/actions/runs/45163717983) |

### 구현된 부분 (정적/Node CI 확인; 실브라우저 E2E는 별도)

- AI 관전: `root.innerHTML` 전체 교체 대신 살아 있는 관전 DOM을 부분 갱신; 모델·속도 select DOM과 스크롤 컨테이너 보존. **네이티브 select가 실제 열려 있는 중의 안정성은 아직 브라우저 검증 전.**
- 새로 뽑은 타일은 기존 손패 맨 끝으로 누적. 턴마다 강제 자동 정렬하지 않고, 사용자가 한 정렬·배치 순서를 드로우 전에 보존. 손패 초기 생성 시만 정렬.
- 관전 양쪽 AI 손패 기본 공개(실제 인간 플레이는 상대 손패 숨김). 물리 타일 ID별 랙/보드 위치 이전·이후, 뽑은 타일 및 타임라인, 과거 턴 seek, FLIP 이동 애니메이션 초안. **선택→집기→운반→놓기의 세밀한 사건 연출은 미완성.**
- `playerObservation(g,p)`로 자기 손패·공개 보드·상대 장수/더미 개수 등을 불변 스냅샷으로 제한하고 기존 AI의 후보 생성에 연결. 시뮬레이터의 원본 상태 변경 경로는 남아 있으므로 정식 순수 행동 API 완성으로 보고하지 않는다.
- 시드 쌍 paired bootstrap(2,000회, 95% 구간), 모델별 실제 누적·평균 추론시간 측정, 시드별 승패 기록. **동일 추론시간 강제는 아직 없다.**

## 이번 새 CI에서 다시 확인한 참고 결과 (아직 공정 시간제한 아님)

- Strategic+ vs Strategic v1.1, seed 10000~10019, 좌석 교환 40판: **24승 16패, 60.0%, paired bootstrap 95% [47.5%, 72.5%]**.
- 평균 AI 턴 계산: Strategic+ **10.90ms**, Strategic **5.35ms** (동일 CI 러너, 같은 시간 제한은 아님). 이 기록만으로 동등시간 승률 우위/SOTA 판정 불가.
- 기존 별도 200판 결과: Strategic+ 127승 73패(63.5%, seed12000~12099), 추론시간 불균형 통제 전.

## 남은 개발 우선순위

1. **P0 실제 브라우저 E2E**: 열린 dropdown/focus, 페이지·보드 스크롤, 모바일, 타일 이동 애니메이션, 턴 seek/재생·일시정지/배속을 Playwright 등으로 시각 검증. 현재 Node CI 통과를 E2E로 오인하지 않는다.
2. **P0 공식 룰과 행동/정보 경계**: Joker 교체/재활용 규칙, 타일 보존 속성 검사, 숨은 상대 손패 및 더미 순서 누출 방지, AI 정책/시뮬레이터·행동 생성/적용 분리.
3. **P0 공정 성능 평가**: 같은 CPU/메모리, 턴당 0.3s/1s/3s, anytime 취소, paired-seed 95% CI, 학습·검증·최종 독립 시드.
4. **P1 전역 Exact Solver**: Exact Cover/ILP/CP-SAT/B&B, 상위 K개 합법 보드 구성 및 조커·동형 타일 처리, 시간 상한.
5. **P2 공개 정보 기반 belief sampling + ISMCTS/POMCP**, Strategic+ 대비 동등시간 A/B; **P3 ExIt/정책·가치/PUCT**, **P4 Deep CFR/ReBeL/MuZero**는 이후 게이트.
6. UI 미완성: AI가 타일 선택·집기·운반·놓기, 기존 테이블 재배열 과정을 실제 움직임으로 구분하고 효과음 타이밍 동기화.

## 재현 링크

- [저장소](https://github.com/oyueo-mm/RummikubAI) · [배포](https://oyueo-mm.github.io/RummikubAI/) · [Actions](https://github.com/oyueo-mm/RummikubAI/actions)
- `npm test`, `npm run benchmark`, `node bench/matchup.mjs 40 10000 strategic-plus strategic`.
- 다음 PR마다 `.context/STATUS.md`, `.context/BACKLOG.md`, `.context/DECISIONS.md` 변경 기록을 함께 갱신하고 GitHub Actions CI/Pages 성공 여부를 확인한다.
