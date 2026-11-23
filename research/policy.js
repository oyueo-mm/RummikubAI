import {candidateTurnPlans} from './belief-search.js';
/** Lightweight, inspectable policy-imitator bootstrap; not yet the full iterative ExIt loop. */
export const FEATURE_NAMES=['placedFraction','penaltyReduction','jokerRetention','rackRunLinks','opponentPressure'];
export const DISTILLED_WEIGHTS=[0.90766081,8.84604151,-1.25310723,-1.43175314,3.49515396]; // Trained with 16 seed games, 14-iteration Belief UCT teacher; CI run 45228856235. Holdout 34 samples: top-1 64.7%.
export function actionFeatures(observation,action){
  const before=observation.rack.reduce((s,t)=>s+(t.color==='joker'?30:t.value),0);
  const after=action.remaining.reduce((s,t)=>s+(t.color==='joker'?30:t.value),0);
  let links=0;
  for(let i=0;i<action.remaining.length;i++)for(let j=i+1;j<action.remaining.length;j++){
    const a=action.remaining[i],b=action.remaining[j];
    if(a.color!=='joker'&&b.color!=='joker'&&(a.value===b.value&&a.color!==b.color||a.color===b.color&&Math.abs(a.value-b.value)===1))links++;
  }
  return [action.used/Math.max(1,observation.rack.length),(before-after)/150,action.remaining.filter(t=>t.color==='joker').length/2,Math.min(1,links/8),action.used/Math.max(1,observation.rack.length)*(observation.opponentTileCount<5?1:0)];
}
export function scoreFeatures(features,weights){return features.reduce((s,f,i)=>s+f*(weights[i]||0),0);}
export function chooseApprenticePlan(observation,weights=DISTILLED_WEIGHTS){
  const options=candidateTurnPlans(observation,{includeGlobal:false});if(!options.length)return null;
  return options.map(plan=>({plan,score:scoreFeatures(actionFeatures(observation,plan),weights)})).sort((a,b)=>b.score-a.score||b.plan.used-a.plan.used)[0].plan;
}
function softmax(values){const top=Math.max(...values),exp=values.map(v=>Math.exp(v-top)),sum=exp.reduce((s,v)=>s+v,0);return exp.map(x=>x/sum);}
export function policyMetrics(dataset,weights){
  let correct=0,loss=0;
  for(const item of dataset){const logits=item.features.map(f=>scoreFeatures(f,weights)),prob=softmax(logits);const guess=logits.indexOf(Math.max(...logits));correct+=Number(guess===item.teacher);loss-=Math.log(Math.max(1e-12,prob[item.teacher]));}
  return{samples:dataset.length,accuracy:correct/Math.max(1,dataset.length),crossEntropy:loss/Math.max(1,dataset.length)};
}
export function trainDistilledPolicy(dataset,{epochs=70,learningRate=.35,regularization=.0003}={}){
  if(!dataset.length)throw Error('No teacher examples');
  const weights=Array.from({length:FEATURE_NAMES.length},()=>0);
  for(let epoch=0;epoch<epochs;epoch++){
    for(const item of dataset){
      const probabilities=softmax(item.features.map(f=>scoreFeatures(f,weights)));
      for(let j=0;j<weights.length;j++){
        let expected=0;for(let i=0;i<item.features.length;i++)expected+=probabilities[i]*item.features[i][j];
        weights[j]+=learningRate*(item.features[item.teacher][j]-expected-regularization*weights[j]);
      }
    }
  }
  return weights;
}
