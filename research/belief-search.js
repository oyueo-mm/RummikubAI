import {actionFeatures} from './policy.js';
import {buildTiles,seededRandom,cloneBoard,playerObservation,createGame,validateMeld,verifyHumanMove,drawFor,endTurn,takeAiTurn,rackPenalty,candidateMelds} from '../engine.js';

/** Sample from public tile conservation WITHOUT using the original game's RNG seed. */
export function sampleHiddenWorld(observation,random=seededRandom(37)){
  const observed=new Set([...observation.rack,...observation.board.flat()].map(t=>t.id));
  const pool=buildTiles().filter(t=>!observed.has(t.id));
  if(pool.length!==observation.opponentTileCount+observation.bagCount)throw Error('Inconsistent public tile conservation');
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const opponent=pool.splice(0,observation.opponentTileCount),racks=[[],[]],opened=[false,false];
  racks[observation.player]=observation.rack.slice();racks[1-observation.player]=opponent;
  opened[observation.player]=observation.opened;opened[1-observation.player]=observation.opponentOpened;
  return{seed:0,bag:pool,racks,board:cloneBoard(observation.board),opened,active:observation.player,turn:observation.turn,passes:0,finished:false,winner:null,log:[]};
}
function proposalState(obs){
  const g={seed:0,bag:[],racks:[[],[]],board:cloneBoard(obs.board),opened:[false,false],active:obs.player,turn:obs.turn,passes:0,finished:false,winner:null,log:[]};
  g.racks[obs.player]=obs.rack.slice();
  g.racks[1-obs.player]=Array.from({length:obs.opponentTileCount},(_,i)=>({id:'unknown-'+i,color:'black',value:1}));
  g.opened[obs.player]=obs.opened;g.opened[1-obs.player]=obs.opponentOpened;
  return g;
}
function planKey(plan){return plan.remaining.map(t=>t.id).sort().join(',')+'|'+plan.board.map(m=>m.map(t=>t.id).sort().join(',')).sort().join('|');}
export function candidateTurnPlans(obs,{includeGlobal=true}={}){
  const plans=[],seen=new Set(),add=(board,remaining,source)=>{
    const p={board:cloneBoard(board),remaining:remaining.slice(),used:obs.rack.length-remaining.length,source};
    if(!p.used)return;
    const synthetic=proposalState(obs),legal=verifyHumanMove(synthetic,p.board,p.remaining,obs.player);
    if(!legal.valid||legal.added!==p.used)return;
    const signature=planKey(p);if(!seen.has(signature)){seen.add(signature);plans.push(p);}
  };
  for(const model of includeGlobal?['greedy','joker-safe','strategic-plus','global-cover']:['greedy','joker-safe','strategic-plus']){
    const state=proposalState(obs),move=takeAiTurn(state,obs.player,model);
    if(move.action==='meld')add(state.board,state.racks[obs.player],model);
  }
  // Independent legal rack-meld proposals create alternative actions for root exploration.
  if(obs.rack.length<=17){
    const melds=candidateMelds(obs.rack).filter(c=>obs.opened||c.score>=30).sort((a,b)=>b.count-a.count||b.score-a.score).slice(0,7);
    for(const c of melds){const placed=new Set(c.tiles.map(t=>t.id));add([...obs.board,c.tiles],obs.rack.filter(t=>!placed.has(t.id)),'rack-meld');}
  }
  return plans;
}
function applyPlan(g,obs,plan){
  if(!plan){const canDraw=g.bag.length>0;drawFor(g,obs.player);endTurn(g);return{action:canDraw?'draw':'pass'};}
  const legal=verifyHumanMove(g,plan.board,plan.remaining,obs.player);
  if(!legal.valid)throw Error('Illegal belief plan: '+legal.reason);
  g.board=cloneBoard(plan.board);g.racks[obs.player]=plan.remaining.slice();g.opened[obs.player]=true;g.passes=0;
  if(!g.racks[obs.player].length){g.finished=true;g.winner=obs.player;}else endTurn(g);
  return{action:'meld',used:plan.used,method:plan.source};
}
function scoreWorld(g,player){
  if(g.finished)return g.winner===null?.5:g.winner===player?1:0;
  const mine=rackPenalty(g.racks[player]),theirs=rackPenalty(g.racks[1-player]);
  return Math.max(0,Math.min(1,.5+.38*Math.tanh((theirs-mine)/65)));
}
function observationKey(obs){let hash=(obs.turn+obs.player+1)>>>0;for(const t of [...obs.rack,...obs.board.flat()]){for(const c of t.id)hash=Math.imul(hash^c.charCodeAt(0),16777619);}return hash>>>0;}
/** Shared root information-set UCT/PUCT. This is a one-root determinization prototype, not full-tree ISMCTS. */
export function beliefRootSearch(obs,{method='uct',iterations=10,includeGlobal=true,priorWeights=null}={}){
  if(method!=='uct'&&method!=='puct')throw Error('Unsupported search method');
  const actions=candidateTurnPlans(obs,{includeGlobal});
  if(!actions.length)return{plan:null,iterations:0,actions:0,method};
  if(actions.length===1)return{plan:actions[0],iterations:0,actions:1,method};
  const counts=actions.map(()=>0),sums=actions.map(()=>0),scores=actions.map(a=>{
    const saved=a.remaining.filter(t=>t.color==='joker').length;
    const value=a.used/Math.max(1,obs.rack.length)+.04*saved;
    if(priorWeights&&priorWeights.length===5)return actionFeatures(obs,a).reduce((sum,f,i)=>sum+f*priorWeights[i],0);
    return 2.5*value;
  }),exp=scores.map(s=>Math.exp(s-Math.max(...scores))),norm=exp.reduce((a,b)=>a+b,0),priors=exp.map(v=>v/norm),random=seededRandom(observationKey(obs));
  for(let i=0;i<iterations;i++){
    let selected=-1,best=-Infinity;
    for(let a=0;a<actions.length;a++){
      const q=counts[a]?sums[a]/counts[a]:.5;
      const bonus=method==='puct'?1.8*priors[a]*Math.sqrt(i+1)/(1+counts[a]):.8*Math.sqrt(Math.log(i+2)/(counts[a]+.15));
      const u=q+bonus;if(u>best){best=u;selected=a;}
    }
    const world=sampleHiddenWorld(obs,random);
    applyPlan(world,obs,actions[selected]);
    if(!world.finished){
      const opponent=world.active;
      takeAiTurn(world,opponent,'greedy');
    }
    const reward=scoreWorld(world,obs.player);
    counts[selected]++;sums[selected]+=reward;
  }
  const ranked=actions.map((plan,i)=>({plan,visits:counts[i],mean:counts[i]?sums[i]/counts[i]:0,prior:priors[i]})).sort((a,b)=>b.visits-a.visits||b.mean-a.mean||b.plan.used-a.plan.used);
  return{plan:ranked[0].plan,iterations,actions:actions.length,method,statistics:ranked.map(x=>({source:x.plan.source,used:x.plan.used,visits:x.visits,estimatedValue:x.mean,prior:x.prior}))};
}
