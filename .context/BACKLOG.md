# RummikubAI — 현재 백로그 (2026-11-23)

> [최신 인수인계](NEXT_CHAT.md)와 [상태](STATUS.md)를 참조. 아래 체크 표시는 구현 코드·CI 수준이며 실브라우저 E2E가 필요하면 별도 미완료로 남긴다.

## 구현·기본 CI 검증 완료

- [x] 106개 물리 타일, 첫 등록 30점, 기본 2인전, 로컬 인간 2인, 6종 AI, 비교·관전·시드 재현.
- [x] 관전 전체 DOM 교체 최소화·선택 컨트롤 노드 보존형 부분 갱신 (실브라우저 E2E 별도).
- [x] 새 뽑은 타일 끝에 추가, 사용자 재정렬/수동 정렬 순서 보존, 턴 경계 강제 자동 정렬 금지.
- [x] 양쪽 관전 AI 손패 기본 공개·큰 타일, 물리 ID별 보드/랙 이벤트·뽑기 기록·FLIP 애니메이션 초안, 턴별 기록/seek.
- [x] PlayerObservation 읽기 경계, 내부 불변 스냅샷 및 기본 비공개 테스트.
- [x] 시드 쌍 paired bootstrap 95% CI, 양쪽 AI 턴별 계산시간 계측 및 원시 시드 결과 출력.
- [x] [PR #7](https://github.com/oyueo-mm/RummikubAI/pull/7) 및 [PR #8](https://github.com/oyueo-mm/RummikubAI/pull/8) CI/Pages 성공 확인.

## P0 — 남은 인터페이스·엔진 신뢰성

- [ ] Playwright 또는 동등한 실제 브라우저 E2E: 스크롤 위치·열린 select·포커스·화면 안정성, 모바일 터치, 타일 드로우/FLIP·턴 seek/재생/일시정지/배속.
- [ ] 구체 행동 시각화: 선택→집기→이동→놓기, 기존 조합 이동·재배열, 효과음 동기화.
- [ ] 클래식 2인 공식 조커 반환/교체·남은 더미/종료/무승부 정확 규칙 버전·별도 오라클/속성 테스트.
- [ ] 완전한 FullState/PlayerObservation 런타임 경계와 순수 합법 행동 생성/적용 API; 게임 규칙 및 합법성 invariant.
- [ ] 추론시간 0.3s/1s/3s, 메모리 제한, anytime 및 결정적 복구, CPU/기계 로그.
- [ ] 독립 학습/검증/평가 seed 리그, seed-pair 신뢰구간·SPRT·회귀 성능 게이트.

## P1 — 수학적 글로벌 턴 솔버

- [ ] 전역 Exact Cover/ILP/CP-SAT/B&B 비교, 조커·물리 동형 타일 대칭 제거.
- [ ] 상위 K개의 서로 다른 완전 합법 최종 보드·잔여 손패 후보, 최적성·시간·후보 다양성 검증.
- [ ] Strategic+와 동일 계산시간에서 승률/속도 비교, 과적합 검증.

## P2 — 정보집합 게임 탐색

- [ ] 공개 이력과 타일 보존에 일관된 belief sampling 및 determinization.
- [ ] ISMCTS/POMCP 정보집합별 탐색과 rollout/행동 추상화 ablation.
- [ ] 동일시간 Strategic+ 대비 독립 시드 승률/구간 비교.

## P3–P4 — 자기대국과 대안 연구

- [ ] Expert Iteration + 정책·가치망/증류/self-play 및 belief-aware PUCT.
- [ ] Deep CFR, ReBeL, MuZero의 축소 게임 ablation 및 자원 대비 효과 검증.

## 완료 판정

게임 기능은 실제 브라우저 사용성, 합법/타일 보존, CPU 예산, 독립 시드 실험, PR CI 및 실제 Pages 성공 증거를 구분하여 보고한다. 외부 표준 기준 없이 SOTA라고 단정하지 않는다.
