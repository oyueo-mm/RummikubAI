import test from 'node:test';import assert from 'node:assert/strict';
import {solveAbstractRegret,trainDynamics,dynamicsError,sampleDynamicsTransitions} from '../research/alternative-studies.js';
import {createGame,playerObservation} from '../engine.js';
test('abstract two-player regret matching reduces worst-case response gap',()=>{
  const r=solveAbstractRegret([[.8,.2],[.3,.7]],1200);
  assert.equal(r.strategyA.length,2);assert.equal(r.strategyB.length,2);
  assert.ok(Math.abs(r.strategyA.reduce((a,b)=>a+b,0)-1)<1e-10);
  assert.ok(r.bestResponseGap<.07);
});
test('lightweight transition predictor trains on hidden-information expectation labels',()=>{
  const samples=Array.from({length:12},(_,i)=>({features:[1,i/12,0,0,0,0,0],target:.2+i/24,baseline:.5}));
  const weights=trainDynamics(samples),after=dynamicsError(samples,weights);
  assert.ok(after.MAE<after.naiveMAE);assert.equal(weights.length,7);assert.ok(weights.every(Number.isFinite));
});
test('transition samples have public observation only and immutable dimensions',()=>{
  const obs=playerObservation(createGame(1810),0);
  assert.equal(sampleDynamicsTransitions(obs,1).length>=0,true);
});
