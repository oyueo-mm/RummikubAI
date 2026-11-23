import {AI_MODELS,simulateMatch} from '../engine.js';
const [countArg='20',seedArg='9000',modelA='strategic-plus',modelB='strategic']=process.argv.slice(2);
const games=Number(countArg),seed=Number(seedArg),names=new Set(AI_MODELS.map(m=>m.id));
if(!Number.isSafeInteger(games)||games<2||games>10000||games%2||!Number.isSafeInteger(seed)||seed<0||!names.has(modelA)||!names.has(modelB))throw Error('Usage: node bench/matchup.mjs <even games 2..10000> <seed> <modelA> <modelB>');
const results={modelA,modelB,games,seed,winsA:0,winsB:0,draws:0,capped:0,totalTurns:0,elapsedMs:0};
const started=performance.now();
for(let i=0;i<games;i++){const models=i%2===0?[modelA,modelB]:[modelB,modelA],game=simulateMatch(seed+Math.floor(i/2),models,180);if(game.winner===null)results.draws++;else if((game.winner===0&&i%2===0)||(game.winner===1&&i%2===1))results.winsA++;else results.winsB++;if(game.capped)results.capped++;results.totalTurns+=game.turns;}
results.elapsedMs=Math.round(performance.now()-started);results.scoreA=(results.winsA+.5*results.draws)/games;results.avgTurns=results.totalTurns/games;
console.log(JSON.stringify(results,null,2));
