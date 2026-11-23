# RummikubAI — 새 채팅 인수인계 (2026-11-23 19:53 KST)

> **이 문서를 새로운 ChatGPT/개발 세션에서 가장 먼저 읽을 것.** 이 문서는 채팅 없이 저장소만 보고도 맥락을 되살리기 위한 인수인계 문서다. 사용자 요구사항 및 연구 목표는 같은 폴더의 `ROADMAP_2P_SOTA.md`가 정본이다.

## 0. 처음 2분 안에 할 일

1. 저장소 확인: https://github.com/oyueo-mm/RummikubAI (기본 브랜치 `main`). 배포: https://oyueo-mm.github.io/RummikubAI/
2. **이 문서 → `STATUS.md` → `BACKLOG.md` → `ROADMAP_2P_SOTA.md` → `UI_UX.md` → `AI_RESEARCH.md` → `DECISIONS.md` → `AGENTS.md`** 순서로 읽는다.
3. `engine.js`, `spectator.js`, `app.js`, `draft.js`, `tile-layout.js`, `hold.js`, `matchup.js`, `bench/` 및 `tests/`를 확인한다.
4. 변경 전 `main` 최신 커밋/미병합 PR/Actions 상태를 조회하고, `npm test`로 현재 검증을 재현한다. 세션 이전 CI 결과를 *새 변경의* 검증으로 오인하지 않는다.
5. 사용자가 이미 요청한 수정 사항은 확인 질문 없이 코드에 반영하는 것을 우선하며, **실제 수정·테스트·배포 상태를 정확히 구분해 보고**한다.

## 1. 프로젝트가 하려는 일

- **최우선 연구 목표: 2인전 루미큐브 최종 승률 최대화, 장기적으로 SOTA급 AI에 도전.**
- 기존 AI 모델 이름을 늘리는 것이 목적이 아니다. 완전한 한 턴 배치 최적화(솔버)와 불완전정보 전체 게임 승률 최적화(AI)를 구분한다.
- 공식 2인전 규칙 버전을 고정하고, 숨겨진 상대 손패·더미 정보를 AI에게 입력하지 않는 게임 환경에서 실험한다. 외부 표준 대국 SOTA는 아직 확인되지 않았으므로 세계 최고라는 주장은 금지.
- 기존 실험 재현, 행동 합법성, 타일 106개 보존, 독립 시드·선후공 교환, 동일 계산시간 예산, 승률 통계가 연구의 기준이다.
- 3·4인전/온라인 매칭은 현재 주요 연구 목표가 아니다. 사람 2인전은 **같은 기기에서 번갈아 진행하는 로컬 플레이**이다.

## 2. 현재 이미 저장소에 있는 구현 — 실제 코드 확인

- 타일 엔진: 숫자 1~13 × 4색 × 2세트 + 조커 2개 = 106개, 최초 손패 14장씩, 첫 등록 30점, 그룹/런 조합 판정, 턴 전환/드로우/게임 종료. 일부 공식 조커 회수·판본별 규칙 완전 검증은 **미완료**.
- 프런트: 홈에서 AI와 플레이/로컬 사람과 플레이/AI 대국 관전. 플레이는 두 프로필·중앙 게임판·하단 랙·주요 동작 버튼, 단색 플랫 UI, 드래그, 약 330ms 길게 눌러 **누른 타일부터 같은 줄 오른쪽으로 연속된 규칙 호환 타일만 묶는** 로직, Undo/Redo, 조합 자동 정렬, 소리 및 음소거.
- 6개 실행 모델: `random`, `greedy`, `joker-safe`, `exact`, `strategic`, `strategic-plus`. 구현체 확인 경로 `engine.js: AI_MODELS, takeAiTurn()`.
- AI 대국 관전: `spectator.js`와 `app.js: htmlSpectate()/watchNext()`; 두 모델 선택·재생·일시정지·한 턴 진행·배속·동일 시드 재시작·손패 표시 토글·결과 로그는 **이미 구현**. 단 **타일별 실제 이동 과정/뽑기 애니메이션/상태 복원 타임라인은 아직 없음**.
- AI 비교: 임의 모델 2개, 동일 시드 선후공 교환, 짧은 반복 대국·시드 설정. CLI: `node bench/matchup.mjs 200 12000 strategic-plus strategic`. `matchup.js`에서 좌석/승자 계수 공통화.
- `.github/workflows/research.yml`: 모델·게임 수·시드를 고르는 **수동 GitHub Actions**. 결과 JSON 아티팩트(보존 30일). 상시 자동 장시간 학습이나 유료 클라우드 환경이 구성된 것은 아니다.

## 3. 이미 관측한 성능 (기록이지 SOTA 인증 아님)

| 비교 | 조건 | 결과 |
| --- | --- | --- |
| Strategic+ vs Strategic v1.1 | 시드 12000~12099, 선후공 교대, 200판 | **127승 73패, 63.5%** |
| Strategic+ vs Strategic v1.1 | 40판 예비 | 24승 16패 |
| Joker Guard vs Greedy | 시드 13000~13049, 100판 | 48승 46패 6무 (A 점수율 51.0%) |
| Strategic v1.1 vs Greedy | 시드 6000~6059, 120판 | 116승 4패 |

- 소스: `AI_RESEARCH.md`; Actions 로그 https://github.com/oyueo-mm/RummikubAI/actions/runs/45156771597
- **동일한 추론시간을 제공하지 않은 실험이므로** 탐색 예산이 큰 모델의 실전 계산 효율·전역 최적성·세계 SOTA 지위를 입증하지 못했다. 2판을 한 시드에서 자리만 바꿔 수행했으므로 통계분석 단위는 시드 쌍으로 취급해야 한다.

## 4. 사용자 최신 요청 — **아직 코드에 미반영된 P0**

**A. AI 관전에서 매 턴 전체 페이지가 다시 그려지는 느낌 해결**
- 현재 `app.js: render()`는 `root.innerHTML`로 앱 전체를 재생성하고, `watchNext()`는 매 AI 행동마다 `render()`를 호출한다.
- 현재 `.spectate-table` 스크롤만 일부 복원하는 구현이 있어도 페이지 전체 스크롤, 열린 `select` 드롭다운, 포커스, 타일 애니메이션 등은 유지되지 않을 수 있다.
- 해결: 관전 영역의 **키가 안정적인 부분 DOM 업데이트** 또는 상태 유지 컴포넌트 구조. 특히 페이지/보드 스크롤, 포커스, 열린 설정 컨트롤, 속도·모델 선택 유지. 1턴마다 새 페이지로 튀지 않도록 브라우저 E2E 검증.

**B. 뽑는 타일을 기존 정렬에 끼워 넣지 말 것**
- 현재 `engine.js: drawFor()`는 `g.racks[p].push(...)`로 **끝에 추가**하지만, `app.js: resetDraft()`가 `sortDraftRack(startDraft(...),sortMode)`를 실행하여 턴 경계마다 다시 자동 정렬한다. 사용자 요구와 충돌.
- 해결: 뽑은 타일은 **맨 끝에 뽑힌 순서 그대로** 누적, 원래 손패 순서 유지. 사용자가 **숫자순/색상순 정렬 버튼을 눌렀을 때만** 전체 정렬.
- 사람이 뽑는 모드와 AI 관전 랙 모두 적용. 뽑은 타일이 무엇인지 짧고 단정한 강조/전달 애니메이션 추가. AI가 낸 뒤 랙에서 없어진 타일만 애니메이션 대상으로 추적.

**C. 관전의 실제 행동 시각화·애니메이션**
- 양쪽 AI 랙을 연구/관전에서 한눈에 볼 수 있도록 충분히 크게 배치 (기본 공개 여부는 `UI_UX.md`와 최신 로드맵 참고).
- 선택된 타일 → 집기 → 실제 테이블 조합으로 이동/재배열 → 놓기, 혹은 더미 → 손패 끝으로 뽑기. 재배열 시 **기존 테이블 타일의 이동도** 단계별로 보이게 한다.
- 현재 `spectator.js: stepSpectator()`는 `last.placed`에 **새로 놓인 타일 ID만 저장**한다. 이동 전후의 전체 보드·랙 상태/자리 정보/뽑은 타일 ID를 기록해야 자연스러운 타일 이동 애니메이션과 턴별 다시 보기가 가능하다.
- 사건(event) 단위 애니메이션과 효과음 연동, 재생/정지/배속 유지. 과한 광택·네온·빛 효과, 상시 설명 문구는 금지.
- 실제 스크롤·드롭다운·애니메이션은 Node 단위 테스트만으로 검증할 수 없으므로 브라우저 E2E/스크린샷을 추가.

## 5. AI 연구 다음 진행 방향 — 모두 **계획이며 구현 전**

자세한 실행 단계와 이유는 `ROADMAP_2P_SOTA.md` 참고.

1. **P0 규칙·관측 경계·행동 API·공정 벤치마크**: 플레이어 관측과 전체 시뮬레이터 상태 분리; AI가 알 수 없는 상대 손패/더미 순서를 보지 않도록 테스트; 공식 조커 규칙 고정.
2. **P1 전역 Exact Turn Solver**: Exact Cover, CP-SAT, ILP, Branch & Bound 등을 비교해 상위 K개 합법 턴 결과 생성. 시간제한 anytime 방식.
3. **P2 정보집합 탐색**: 상대 손패의 belief 샘플링 → ISMCTS/POMCP·determinization 등, 강한 현재 모델과 공정 비교.
4. **P3 Expert Iteration, 정책/가치 신경망, AlphaZero식 PUCT**: 정확 솔버/탐색을 교사로 self-play→학습→재탐색.
5. **P4 Deep CFR, ReBeL, MuZero**: 축소된 2인전 실험부터 시작, 자원/수렴/성능 검증 후 필요하면 주력 통합.
6. **동일 CPU 시간 예산 실험**을 통해 `strategic-plus`를 기준으로 실제 최종 승률을 비교. 모델 우열은 기존 연구의 숫자를 재진술하는 대신 새 코드로 재현.

## 6. 다음 작업 권장 순서

1. `app.js`의 관전 전체 재렌더링 문제를 먼저 고치고, 브라우저 E2E에서 **페이지/보드 스크롤, 열린 select, 포커스**가 유지되는지 확인.
2. `resetDraft()`의 자동 정렬 문제 수정. 뽑기 → 끝에 누적 → 별도 정렬 클릭 동작을 자동 테스트로 확인.
3. `spectator.js`의 **전후 상태 기반 행동 이벤트** 추가; 한 턴을 선택/이동/놓기 또는 뽑기/수령으로 나눈 애니메이션 구현.
4. 공식 2인전 규칙 테스트 강화 + `PlayerObservation` 인터페이스 분리 (정보누출 방지).
5. **전역 Exact Solver** 작업 브랜치 시작. 후보 생성 정확도와 속도를 우선 비교한 뒤 ISMCTS를 연결.
6. 각 기능 배포 후 `.context/STATUS.md`와 `BACKLOG.md` 갱신하고 GitHub Pages 성공 확인.

## 7. 디자인/소통 취향과 주의점

- 사용자는 실제 루미큐브 웹게임의 친숙한 구성을 선호한다. 기존 v0.3~v0.6 UI를 여러 번 '별로'라고 평가했고 **본질적인 레이아웃과 조작 개선을 원하며, 장식적인 광택이나 정보 패널 추가를 원하지 않는다**.
- 흰색·검정 글씨·파란 강조를 기본으로 하고, 게임판은 단색의 명료한 파란색. 타일과 랙 크기, 손에 잡히는 느낌, 조합의 촘촘한 정렬이 더 중요하다. 튜토리얼 상시 문구·상태 수치·리서치 디버그 텍스트는 기본 숨김.
- 제이콥의 법칙 등 익숙한 조작 기대를 우선. 롱프레스는 **눌린 위치 기준 오른쪽으로 물리적으로 이어지는 유효 조합만 자동 묶기**. 과거 v0.4의 전역 자동 탐색과 v0.5의 무조건 스와이프 묶기는 사용자가 수정 요구하여 폐기한 방식.
- AI 성능 우월성에 대한 근거 없는 단정 금지. SOTA라 부르지 말 것. AI의 내부 상대 정보 도용 금지.
- 모든 기능 완료 보고에는 **GitHub 커밋/PR, 테스트 결과, Pages 실제 성공 여부**를 포함. 브라우저에서 직접 테스트하지 않았으면 '시각적·상호작용 검증 전'이라고 말한다.

## 8. 실행 및 링크

- 저장소: https://github.com/oyueo-mm/RummikubAI
- 서비스: https://oyueo-mm.github.io/RummikubAI/
- GitHub Actions: https://github.com/oyueo-mm/RummikubAI/actions
- 수동 연구 워크플로: https://github.com/oyueo-mm/RummikubAI/actions/workflows/research.yml
- 최신 구현 PR #6: https://github.com/oyueo-mm/RummikubAI/pull/6 (이미 병합)
- 2026-11-23 19:51 KST 조회 기준, 문서 전용 커밋 `91ba7d39`까지 CI 및 Pages 성공: CI https://github.com/oyueo-mm/RummikubAI/actions/runs/45159929165, Pages https://github.com/oyueo-mm/RummikubAI/actions/runs/45159929796
- 실행: `npm test`, `npm run benchmark`, `node bench/matchup.mjs 200 12000 strategic-plus strategic`. UI 로컬 서빙: `python -m http.server 8000`.
- **이 인수인계 문서 추가 이후의 CI/Pages 상태는 다시 조회할 것.**
