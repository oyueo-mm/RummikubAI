# RummikubAI — 현재 상태 (2026-11-23 19:53 KST 인수인계)

> 이 문서는 **현재 코드로 확인된 기능**과 **아직 구현하지 않은 사용자 요청**을 분리한다. 이전 버전 문서의 'PR #6 배포 전' 기록은 오래된 내용이다. 최신 인수인계: [NEXT_CHAT.md](NEXT_CHAT.md), 실천 체크리스트: [BACKLOG.md](BACKLOG.md).

## 저장소와 배포

- GitHub: https://github.com/oyueo-mm/RummikubAI (`main`)
- GitHub Pages: https://oyueo-mm.github.io/RummikubAI/
- 기능 PR #6: https://github.com/oyueo-mm/RummikubAI/pull/6 — **2026-11-23 병합 완료**, 병합 커밋 `7f62e8c5`.
- 이후 계획 문서 커밋 `91ba7d39`까지 CI 및 Pages **성공 확인**: [CI](https://github.com/oyueo-mm/RummikubAI/actions/runs/45159929165) · [Pages](https://github.com/oyueo-mm/RummikubAI/actions/runs/45159929796).
- **이번 인수인계 문서 변경을 포함한 최신 커밋의 CI/Pages는 새 채팅에서 다시 확인할 것.** 단순 문서 저장과 게임 기능 구현/시각 검증은 서로 다르다.

## 최우선 목표

**표준 2인전 루미큐브에서 실제 승률이 가장 높은 AI를 개발하고, 공정·재현 가능한 실험으로 SOTA급 성능을 입증하는 것.** 전체 게임의 승률 최적화는 단일 턴 타일 최다 배치와 다르다.

## 현재 코드에 존재하는 기능

- 규칙 엔진: 106개 물리 타일(조커 2개), 최초 14장, 그룹/런 검사, 첫 등록 30점, 뽑기/턴 전환/끝내기, 타일 보존 검증(모든 공식 변형 규칙 완성은 아님).
- 웹 홈: AI와 플레이, 사람과 플레이(같은 기기 2인), AI 대국 관전. 두 사람은 턴 전환 화면을 거치고 AI/사람 플레이에서는 상대 패 비공개.
- 플레이: 단색 테이블·하단 랙·좌우 플레이어/행동 버튼, 롱프레스의 오른쪽 연속 유효 타일 묶기, 기존 조합으로 타일 추가 시 유효 완성 조합 정렬, 드래그, Undo/Redo, 힌트, 사운드.
- AI 관전: 2개 모델 선택, 재생/일시정지, 한 턴 진행, 배속, seed 재생, 손패 표시 토글, 턴 기록·승자 표시는 이미 존재. **하지만 실제 이동 애니메이션과 안정된 부분 렌더링은 아직 없음.**
- AI 6종: `random`, `greedy`, `joker-safe`, `exact`, `strategic`, `strategic-plus` (`engine.js`). Strategic+는 국소 Exact 탐색 후보를 48개까지, Strategic v1.1은 16개까지 검토.
- AI 비교: 선택 모델 쌍과 seed·대국 수, 자리 교환 결과. 재현 스크립트 `bench/matchup.mjs`; 수동 Actions `.github/workflows/research.yml`.

## 미해결 P0 (사용자가 이미 수정 요청한 항목)

1. **AI 관전 스크롤·드롭다운 리셋**: `app.js: watchNext()`에서 행동마다 `render()`를 호출하고 `render()`가 `root.innerHTML` 전체를 교체. 보드의 일부 스크롤만 복원하고 전체 페이지/포커스/드롭다운 상태는 보장하지 못함.
2. **새 뽑은 타일 끝에 누적**: `engine.js: drawFor()`는 push하지만 `app.js: resetDraft()`의 자동 정렬로 새 타일이 기존 정렬 순서에 합쳐짐. 뽑은 순서대로 맨 끝에 보이도록 수정, 사용자가 정렬 클릭할 때만 전체 정렬.
3. **AI 손패와 실제 동작 애니메이션**: 관전에서 양쪽 AI 패 가독성 강화, 타일 선택→집기→테이블로 이동/재배열→놓기 및 더미→랙 맨 끝 뽑기. 현재 `spectator.js` 이벤트는 결과의 새 타일 ID만 추적하므로 이동 전후 기록이 필요.
4. **브라우저 UI E2E**: 스크롤·select 열림·포커스·모바일 터치/랙 순서/애니메이션을 실제 브라우저로 검증. 과한 빛·영문 장식·설명문 추가 금지.

## 연구 다음 단계 — 모두 미구현/미검증

- P0: 공식 2인전 조커/종료 규칙 확정, `FullState` vs `PlayerObservation` 정보 경계 테스트, 합법 행동 생성/적용 API, **동일 계산시간** + 시드 쌍 단위 승률 추정.
- P1: 전역 Exact Cover/ILP/CP-SAT/B&B 한 턴 솔버와 다양한 합법 후보 생성.
- P2: 상대 패 belief 샘플링과 ISMCTS / determinization.
- P3: ExIt, 정책망/가치망, AlphaZero식 PUCT.
- P4: 2인전 축소 게임에 ReBeL/Deep CFR, MuZero ablation.
- 모델 개선은 이전 최강 Strategic+ 및 이전 모델들 대비 **독립 시드·좌석 교환·같은 CPU 시간**에서 검증하며, 외부 루미큐브 SOTA는 아직 확인되지 않았다.

## 과거 실험 사실(아직 SOTA 인증 아님)

- Strategic+ vs Strategic v1.1: **200판 127승 73패(63.5%)**, seed 12000~12099, 선후공 교환.
- Strategic v1.1 vs Greedy: **120판 116승 4패(96.7%)**, seed 6000~6059.
- Joker Guard vs Greedy: 100판 48승 46패 6무.
- 위 실험은 동일 계산시간을 보장하지 않음. 결과·소스: [AI_RESEARCH.md](AI_RESEARCH.md) 및 [Actions 로그](https://github.com/oyueo-mm/RummikubAI/actions/runs/45156771597).

## 실행/재현

- `npm test` — Node 내장 테스트 러너 (`package.json` 참고)
- `npm run benchmark` — 기본 모델 매치업
- `node bench/matchup.mjs 200 12000 strategic-plus strategic` — 모델 2개/시드/대국 수 지정
- `python -m http.server 8000` — 로컬 정적 페이지 서빙
- 수동 장시간 연구: https://github.com/oyueo-mm/RummikubAI/actions/workflows/research.yml

**다음 코딩 작업은 [BACKLOG.md](BACKLOG.md)의 P0 관전·랙 정렬 버그부터 시작할 것.** 완료한 뒤 이 상태 문서를 업데이트하고 실제 브라우저 및 GitHub Pages 결과를 확인한다.
