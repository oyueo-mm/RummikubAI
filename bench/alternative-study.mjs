import {createGame,playerObservation,takeAiTurn} from '../engine.js';
import {candidateTurnPlans} from '../research/belief-search.js';
import {abstractBeliefMatrix,solveAbstractRegret,sampleDynamicsTransitions,trainDynamics,dynamicsError} from '../research/alternative-studies.js';
const start=Number(process.argv[2]??'59000'),n=Number(process.argv[3]??'4');
if(!Number.isSafeInteger(start)||!Number.isSafeInteger(n)||n<2||n>30)throw Error('Usage: node bench/alternative-study.mjs [seed] [games 2..30]');
function positions(base,gameCount){
  const out=[];
  for(let k=0;k<gameCount;k++){const g=createGame(base+k);for(let t=0;t<38&&!g.finished;t++){
    if(t%4===0){const obs=playerObservation(g,g.active);if(obs.opened&&candidateTurnPlans(obs,{includeGlobal:false}).length)out.push(obs);}
    takeAiTurn(g,g.active,k%2?'greedy':'strategic-plus');
  }}return out;
}
const startTime=performance.now(),trainStates=positions(start,n),holdoutStates=positions(start+100000,Math.max(2,Math.ceil(n/2)));
const dataset=trainStates.flatMap(obs=>sampleDynamicsTransitions(obs,2)),validation=holdoutStates.flatMap(obs=>sampleDynamicsTransitions(obs,2));
const weights=dataset.length?trainDynamics(dataset):null,selected=trainStates.find(obs=>candidateTurnPlans(obs,{includeGlobal:false}).length>=2);
const matrix=selected?abstractBeliefMatrix(selected,{worlds:4}):null;
const result={study:'P4 prerequisites only — NOT Deep CFR, ReBeL or MuZero',seed:start,trainStates:trainStates.length,holdoutStates:holdoutStates.length,publicBeliefNormalForm:matrix?{...matrix,regret:solveAbstractRegret(matrix.matrix,700)}:null,dynamics:weights?{weights:weights.map(v=>+v.toFixed(5)),train:dynamicsError(dataset,weights),holdout:dynamicsError(validation,weights)}:null,elapsedMs:Math.round(performance.now()-startTime)};
console.log(JSON.stringify(result,null,2));
