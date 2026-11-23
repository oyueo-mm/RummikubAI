import test from 'node:test';import assert from 'node:assert/strict';
import {buildTiles,createGame,playerObservation,takeAiTurn,verifyHumanMove,validateMeld} from '../engine.js';
import {sampleHiddenWorld,candidateTurnPlans,beliefRootSearch} from '../research/belief-search.js';
import {solveGlobalCover} from '../research/global-cover.js';
test('belief hidden-world sampler conserves all 106 physical tiles and never reads original hidden racks',()=>{
  const game=createGame(305),observation=playerObservation(game,0);
  const a=sampleHiddenWorld(observation),b=sampleHiddenWorld(observation,()=>0.3);
  for(const state of [a,b]){const ids=[...state.bag,...state.racks.flat(),...state.board.flat()].map(t=>t.id);assert.equal(ids.length,106);assert.equal(new Set(ids).size,106);assert.deepEqual(state.racks[0],observation.rack);assert.equal(state.racks[1].length,14);assert.equal(state.bag.length,78);}
  game.racks[1].reverse();game.bag.reverse();
  assert.deepEqual(playerObservation(game,0),observation);
  assert.notDeepEqual(a.racks[1],b.racks[1]);
});
test('root search yields only moves verified by the same engine used for human play',()=>{
  const g=createGame(50);let obs=playerObservation(g,0);
  let result=beliefRootSearch(obs,{iterations:3,includeGlobal:false});
  if(result.plan)assert.ok(verifyHumanMove(g,result.plan.board,result.plan.remaining,0).valid);
  for(let k=0;k<50&&!g.finished;k++){takeAiTurn(g,g.active,'greedy');if(g.opened[g.active]&&g.racks[g.active].length){obs=playerObservation(g,g.active);result=beliefRootSearch(obs,{method:'puct',iterations:3,includeGlobal:false});if(result.plan){assert.ok(verifyHumanMove(g,result.plan.board,result.plan.remaining,g.active).valid);break;}}}
});
test('new research models conserve tiles and keep board melds legal in real games',()=>{
  for(const model of ['global-cover','belief-uct','belief-puct']){
    const g=createGame(601);for(let t=0;t<25&&!g.finished;t++){takeAiTurn(g,g.active,g.active===0?model:'greedy');const ids=[...g.bag,...g.racks.flat(),...g.board.flat()].map(x=>x.id);assert.equal(ids.length,106,model);assert.equal(new Set(ids).size,106,model);assert.ok(g.board.every(m=>validateMeld(m).valid),model);}
  }
});
test('bounded global cover gracefully skips boards above configured cap',()=>{
  const tiles=buildTiles();const board=Array.from({length:12},(_,i)=>tiles.slice(i*3,i*3+3));
  assert.equal(solveGlobalCover(board,tiles.slice(38,52),{maxTiles:18}),null);
});
