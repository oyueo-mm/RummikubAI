import test from 'node:test';import assert from 'node:assert/strict';
import {trainDistilledPolicy,policyMetrics,scoreFeatures,actionFeatures,chooseApprenticePlan,DISTILLED_WEIGHTS} from '../research/policy.js';
import {createGame,playerObservation,verifyHumanMove} from '../engine.js';
test('policy-gradient imitation learns teacher preferences on a synthetic candidate dataset',()=>{
  const x=[{features:[[1,0,0,0,0],[0,1,0,0,0]],teacher:0},{features:[[.8,.1,0,0,0],[.1,.7,0,0,0]],teacher:0}];
  const before=policyMetrics(x,[0,0,0,0,0]),weights=trainDistilledPolicy(x,{epochs:60});
  assert.equal(weights.length,5);assert.ok(weights.every(Number.isFinite));assert.ok(policyMetrics(x,weights).crossEntropy<before.crossEntropy);
  assert.ok(scoreFeatures([1,0,0,0,0],weights)>scoreFeatures([0,1,0,0,0],weights));
});
test('untrained prior has explicit provenance; apprentice emits only legal plans',()=>{
  assert.equal(DISTILLED_WEIGHTS.length,5);
  const g=createGame(20002),obs=playerObservation(g,0);
  const plan=chooseApprenticePlan(obs);
  if(plan){assert.ok(verifyHumanMove(g,plan.board,plan.remaining,0).valid);assert.equal(actionFeatures(obs,plan).length,5);}
});
