import {seededRandom,takeAiTurn,verifyHumanMove,endTurn,rackPenalty} from '../engine.js';
import {sampleHiddenWorld,candidateTurnPlans} from './belief-search.js';

function playRoot(world,obs,plan){
  const ok=verifyHumanMove(world,plan.board,plan.remaining,obs.player);
  if(!ok.valid)throw Error('Invalid study action: '+ok.reason);
  world.board=plan.board.map(m=>m.slice());world.racks[obs.player]=plan.remaining.slice();world.opened[obs.player]=true;world.passes=0;
  if(!plan.remaining.length){world.finished=true;world.winner=obs.player;}else endTurn(world);
}
function outcome(world,p){
  if(world.finished)return world.winner===null?.5:world.winner===p?1:0;
  return Math.max(0,Math.min(1,.5+.4*Math.tanh((rackPenalty(world.racks[1-p])-rackPenalty(world.racks[p]))/65)));
}
/** Real Rummikub one-turn payoff matrix aggregated across belief worlds.
 * Opponent columns are fixed response policies, NOT the game's complete legal action tree.
 */
export function abstractBeliefMatrix(obs,{worlds=6,responses=['greedy','strategic-plus']}={}){
  const actions=candidateTurnPlans(obs,{includeGlobal:false}).slice(0,4);
  if(!actions.length)return null;
  const matrix=actions.map(()=>responses.map(()=>0));
  for(let w=0;w<worlds;w++){
    const rand=seededRandom(51231+obs.turn*179+w*47),sample=sampleHiddenWorld(obs,rand);
    for(let i=0;i<actions.length;i++)for(let j=0;j<responses.length;j++){
      const world={...sample,racks:sample.racks.map(r=>r.slice()),board:sample.board.map(m=>m.slice()),opened:sample.opened.slice(),bag:sample.bag.slice(),log:[]};
      playRoot(world,obs,actions[i]);
      if(!world.finished)takeAiTurn(world,world.active,responses[j]);
      matrix[i][j]+=outcome(world,obs.player)/worlds;
    }
  }
  return{actions:actions.map(a=>({source:a.source,used:a.used})),responses,matrix,worlds};
}
function regretPolicy(regrets){
  const plus=regrets.map(x=>Math.max(0,x)),sum=plus.reduce((a,b)=>a+b,0);
  return sum>0?plus.map(v=>v/sum):plus.map(()=>1/plus.length);
}
/** Normal-form regret matching (CFR-inspired abstraction; NOT Deep CFR or ReBeL). */
export function solveAbstractRegret(matrix,iterations=500){
  if(!matrix.length||!matrix[0].length||matrix.some(row=>row.length!==matrix[0].length))throw Error('Invalid payoff matrix');
  const rows=matrix.length,cols=matrix[0].length,regretA=Array(rows).fill(0),regretB=Array(cols).fill(0),sumA=Array(rows).fill(0),sumB=Array(cols).fill(0);
  for(let t=0;t<iterations;t++){
    const pa=regretPolicy(regretA),pb=regretPolicy(regretB);
    for(let i=0;i<rows;i++)sumA[i]+=pa[i];
    for(let j=0;j<cols;j++)sumB[j]+=pb[j];
    const valuesA=pa.map((_,i)=>pb.reduce((x,v,j)=>x+v*matrix[i][j],0));
    const expectedA=pa.reduce((x,v,i)=>x+v*valuesA[i],0);
    const valuesB=pb.map((_,j)=>pa.reduce((x,v,i)=>x+v*(1-matrix[i][j]),0));
    const expectedB=pb.reduce((x,v,j)=>x+v*valuesB[j],0);
    for(let i=0;i<rows;i++)regretA[i]+=valuesA[i]-expectedA;
    for(let j=0;j<cols;j++)regretB[j]+=valuesB[j]-expectedB;
  }
  const strategyA=sumA.map(x=>x/iterations),strategyB=sumB.map(x=>x/iterations);
  const maxA=Math.max(...matrix.map(row=>row.reduce((s,v,j)=>s+v*strategyB[j],0)));
  const minB=Math.min(...strategyB.map((_,j)=>strategyA.reduce((s,v,i)=>s+v*matrix[i][j],0)));
  return{strategyA,strategyB,bestResponseGap:Math.max(0,maxA-minB),lowerValue:minB,upperValue:maxA,iterations};
}
/** Single-step scalar next-state surrogate; a MuZero prerequisite, not MuZero itself. */
export function dynamicsFeatures(obs,plan){return[1,obs.opponentTileCount/20,obs.bagCount/78,obs.rack.length/20,plan.used/20,obs.opened?1:0,obs.board.flat().length/106];}
export function trainDynamics(data,{epochs=180,rate=.12}={}){
  if(!data.length)throw Error('No transition records');
  const weights=Array(7).fill(0);
  for(let epoch=0;epoch<epochs;epoch++)for(const {features,target} of data){
    const prediction=features.reduce((s,v,i)=>s+v*weights[i],0),error=prediction-target;
    for(let i=0;i<weights.length;i++)weights[i]-=rate*error*features[i];
  }
  return weights;
}
export function dynamicsError(data,weights){
  const errors=data.map(({features,target,baseline})=>({model:Math.abs(features.reduce((s,v,i)=>s+v*weights[i],0)-target),naive:Math.abs(baseline-target)}));
  return{samples:data.length,MAE:errors.reduce((s,e)=>s+e.model,0)/Math.max(1,errors.length),naiveMAE:errors.reduce((s,e)=>s+e.naive,0)/Math.max(1,errors.length)};
}
export function sampleDynamicsTransitions(obs,worlds=2){
  const plans=candidateTurnPlans(obs,{includeGlobal:false});
  if(!plans.length)return[];
  const plan=plans[0],data=[];
  for(let w=0;w<worlds;w++){
    const world=sampleHiddenWorld(obs,seededRandom(70917+obs.turn*49+w*101));
    playRoot(world,obs,plan);
    if(!world.finished)takeAiTurn(world,world.active,'strategic');
    const target=world.racks[1-obs.player].length/20;
    data.push({features:dynamicsFeatures(obs,plan),target,baseline:Math.min(20,obs.opponentTileCount+1)/20});
  }
  return data;
}
