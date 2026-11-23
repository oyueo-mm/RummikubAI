import {createGame,playerObservation,takeAiTurn} from '../engine.js';
import {candidateTurnPlans,beliefRootSearch} from '../research/belief-search.js';
import {actionFeatures,trainDistilledPolicy,policyMetrics,FEATURE_NAMES} from '../research/policy.js';
const games=Number(process.argv[2]??'6'),baseSeed=Number(process.argv[3]??'51000'),teacherIterations=Number(process.argv[4]??'12');
if(!Number.isSafeInteger(games)||games<2||games>100||!Number.isSafeInteger(baseSeed)||!Number.isSafeInteger(teacherIterations)||teacherIterations<2||teacherIterations>80)throw Error('Usage: node bench/train-exit.mjs [games 2..100] [seed] [UCT iterations 2..80]');
const signature=p=>p.remaining.map(t=>t.id).sort().join(',')+'|'+p.board.map(m=>m.map(t=>t.id).sort().join(',')).sort().join('|');
function collect(start,n){
  const dataset=[];let positions=0;
  for(let k=0;k<n;k++){
    const g=createGame(start+k);
    for(let turn=0;turn<38&&!g.finished;turn++){
      const obs=playerObservation(g,g.active),plans=candidateTurnPlans(obs,{includeGlobal:false});positions++;
      if(plans.length>1){
        const expert=beliefRootSearch(obs,{method:'uct',iterations:teacherIterations,includeGlobal:false});
        const target=plans.findIndex(p=>signature(p)===signature(expert.plan));
        if(target>=0)dataset.push({features:plans.map(p=>actionFeatures(obs,p)),teacher:target});
      }
      takeAiTurn(g,g.active,k%2===0?'strategic-plus':'greedy');
    }
  }
  return{dataset,positions};
}
const started=performance.now(),train=collect(baseSeed,games),validation=collect(baseSeed+100000,Math.max(2,Math.ceil(games/3)));
if(!train.dataset.length||!validation.dataset.length)throw Error('Training and validation need multiple candidate actions');
const weights=trainDistilledPolicy(train.dataset),result={method:'single-round-belief-UCT-distillation (ExIt bootstrap only)',teacherIterations,trainSeeds:[baseSeed,baseSeed+games-1],holdoutSeeds:[baseSeed+100000,baseSeed+100000+Math.max(2,Math.ceil(games/3))-1],features:FEATURE_NAMES,trainPositions:train.positions,validationPositions:validation.positions,weights:weights.map(w=>+w.toFixed(8)),train:policyMetrics(train.dataset,weights),holdout:policyMetrics(validation.dataset,weights),holdoutZeroBaseline:policyMetrics(validation.dataset,weights.map(()=>0)),elapsedMs:Math.round(performance.now()-started)};
console.log(JSON.stringify(result,null,2));
