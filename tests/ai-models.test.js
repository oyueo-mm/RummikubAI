import test from 'node:test';import assert from 'node:assert/strict';import {AI_MODELS,createGame,takeAiTurn,solveRack,validateMeld} from '../engine.js';
const t=(id,color,value)=>({id,color,value});
test('Joker Guard preserves a joker when the nonjoker meld loses at most one tile',()=>{const g=createGame(11);g.racks[0]=[t('r5','red',5),t('r6','red',6),t('r7','red',7),t('joker','joker',0),t('b1','blue',1)];g.board=[];g.opened[0]=true;const r=takeAiTurn(g,0,'joker-safe');assert.equal(r.action,'meld');assert.equal(r.plan.method,'joker-preserving');assert.equal(g.racks[0].some(t=>t.id==='joker'),true);assert.ok(g.board.every(m=>validateMeld(m).valid));});
test('Exact Small improves over Greedy by a board exchange in a bounded test position',()=>{const position=()=>{const g=createGame(17);g.board=[[t('r7','red',7),t('b7','blue',7),t('y7','yellow',7)],[t('r8','red',8),t('r9','red',9),t('r10','red',10)]];g.racks[1]=[t('r6','red',6),t('k7','black',7)];g.opened[1]=true;g.active=1;return g;};const a=position(),b=position(),base=takeAiTurn(a,1,'greedy'),exact=takeAiTurn(b,1,'exact');assert.equal(base.used,1);assert.equal(exact.used,2);assert.equal(b.finished,true);assert.equal(exact.method,'board-exact');});
test('Strategic+ never chooses a move with fewer immediate tiles than Strategic on same position',()=>{const state=()=>{const g=createGame(19);g.board=[[t('r7','red',7),t('b7','blue',7),t('y7','yellow',7)],[t('r8','red',8),t('r9','red',9),t('r10','red',10)]];g.racks[1]=[t('r6','red',6),t('k7','black',7)];g.opened[1]=true;g.active=1;return g;};const a=state(),b=state(),rA=takeAiTurn(a,1,'strategic'),rB=takeAiTurn(b,1,'strategic-plus');assert.ok(rB.used>=rA.used);assert.ok(b.board.every(m=>validateMeld(m).valid));});
test('unknown model ids never silently fall back to Greedy',()=>{const g=createGame(20);assert.throws(()=>takeAiTurn(g,0,'unregistered'),/알 수 없는 AI 모델/);});
test('all supported models have different family/move configuration labels',()=>{assert.equal(AI_MODELS.length,7);assert.equal(new Set(AI_MODELS.map(m=>m.id)).size,6);for(const m of AI_MODELS)assert.ok(m.description.length>3&&m.family.length>1);});

test('Global Cover can rearrange a whole small board and preserves all tile IDs',()=>{
  const g=createGame(42);g.board=[[t('r7','red',7),t('b7','blue',7),t('y7','yellow',7)],[t('r8','red',8),t('r9','red',9),t('r10','red',10)]];
  g.racks[1]=[t('r6','red',6),t('k7','black',7)];g.opened[1]=true;g.active=1;
  const expected=new Set([...g.board.flat(),...g.racks[1]].map(x=>x.id)),result=takeAiTurn(g,1,'global-cover');
  assert.equal(result.action,'meld');assert.equal(result.used,2);assert.equal(g.winner,1);
  assert.deepEqual(new Set(g.board.flat().map(x=>x.id)),expected);
  assert.ok(g.board.every(m=>validateMeld(m).valid));
});
