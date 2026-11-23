# RummikubAI — 5계열 AI 연구 기록 (2026-11-24)

> PR #9 연구 상태 기록. 구현 수준과 원 논문 전체 알고리즘을 반드시 구별한다. SOTA 또는 최강 입증 아님.

## 추가된 모델 4종과 상태

| 모델 | 구현 | 한계 |
| --- | --- | --- |
| Global Cover β (global-cover) | 모든 공개 보드의 타일을 필수로 두는 전역 후보 Exact Cover + 제한적 B&B, 후보 최대 12,000·노드 1,400·38 타일 | 노드 상한에 걸리면 전역 최적성 불명. 큰 보드는 Strategic+ 폴백. K-best/ILP/CP-SAT 없음 |
| Belief UCT β (belief-uct) | 106개 타일 보존 기반 상대 손패/더미 샘플 + 공유 루트 UCT 8회·상대 Greedy 1턴 rollout | 다층 ISMCTS/POMCP 아님 |
| Belief PUCT β (belief-puct) | 공유 루트 PUCT 12회, 정책 prior와 belief rollout | 신경망 가치망/다층 PUCT 미구현. prior는 16개 학습 게임/6개 홀드아웃 게임에서 UCT 교사 행동 모방으로 학습한 선형 계수를 사용 (CI 45228856235; 평가 정확도 64.7%) |
| Apprentice β (exit-apprentice) | Belief UCT를 교사로 모방하는 경량 선형 softmax 정책 학습·홀드아웃 평가 | ExIt 단일 증류 부트스트랩. 반복 self-play, 신경망 policy/value 미구현 |

## Deep CFR · ReBeL · MuZero 실험 도구 (실전 AI 아님)

- research/alternative-studies.js: 실제 루미큐브에서 표본화한 보이지 않는 타일 배치별로 루트 합법 행동 × 상대 Greedy/Strategic+ 정책의 보상 행렬을 만들고 양측 regret matching을 실행한다. 이는 **축소 정상형 게임의 CFR 유사 진단**이며 Deep CFR의 neural regret/function approximation과 ReBeL의 재귀적 공통신념 탐색은 아직 구현되지 않았다.
- 같은 파일의 learned-dynamics probe는 정확한 엔진으로 얻은 다음 상태를 선형 회귀해 별도 시드에서 MAE와 단순 추정 기준선을 비교한다. **MuZero의 잠재상태·reward/policy/value heads 및 MCTS는 아니다.**
- 이들은 P4 타당성 조사용으로, 시뮬레이션 2인전 AI 레지스트리에 실전 모델인 양 등록하지 않는다.

## 비공개 정보 검증

- playerObservation()에 원본 게임 seed가 있으면 같은 seed로 상대 손패/더미를 역산 가능하다. 신규 수정에서 이 seed를 관측으로 전달하지 않는다.
- sampleHiddenWorld()은 자기 손패+공개 게임판 물리 ID를 제외한 타일만 상대의 알려진 패 개수와 더미 개수에 맞춰 새로 배정한다. 진짜 상대 손패와 더미의 순서를 읽지 않는다.
- 선택한 수는 실제 게임 엔진의 verifyHumanMove()로 재검증한다. 전체 106개 타일 보존과 합법성을 테스트한다.

## 재현 및 자원

- 자동 테스트: npm test
- 승률 비교: node bench/matchup.mjs 40 71000 global-cover strategic-plus
- 승률 비교: node bench/matchup.mjs 40 72000 belief-uct strategic-plus
- 승률 비교: node bench/matchup.mjs 40 73000 belief-puct strategic-plus
- 승률 비교: node bench/matchup.mjs 40 74000 exit-apprentice strategic-plus
- 단일 정책 증류: node bench/train-exit.mjs 16 51000 14
- 축소 게임/대리 전이 모델: node bench/alternative-study.mjs 59000 4
- 자리 교환 + seed-pair bootstrap + 모델별 평균 추론시간 기록. **같은 CPU 시간 예산 승률 비교는 아직 미실시.**

## 남은 연구 게이트

1. 공식 룰 조커 반환·고갈 판정 오라클과 순수 Action API.
2. Global cover 최적성 기준 사례, 대칭 제거, 상위 K, anytime 시간 예산·ILP/CP-SAT 비교.
3. 전체 정보집합 다층 트리 ISMCTS/POMCP, 공개 행동 이력 일관성 제약, rollout 앙상블.
4. 복수 세대 자기대국 ExIt + 학습 policy/value 신경망, 학습 전/후 PUCT ablation.
5. Deep CFR 신경망 regret buffer, ReBeL 공통 신념 재귀 search, MuZero latent dynamics/search를 별도 축소 게임부터 실험.
6. 독립 시드의 충분한 대국 및 동일 자원 실험에서 이전 최강 Strategic+를 넘어설 때에만 기본 모델을 교체.

참고문헌: [Rummikub ILP](https://academic.oup.com/comjnl/article-abstract/49/6/665/356316), [ISMCTS](https://eprints.whiterose.ac.uk/id/eprint/75048/), [ExIt](https://proceedings.neurips.cc/paper/2017/hash/d8e1344e27a5b08cdfd5d027d9b8d6de-Abstract.html), [Deep CFR](https://proceedings.mlr.press/v97/brown19b), [ReBeL](https://ai.meta.com/research/publications/combining-deep-reinforcement-learning-and-search-for-imperfect-information-games/), [MuZero](https://www.nature.com/articles/s41586-020-03051-4).
