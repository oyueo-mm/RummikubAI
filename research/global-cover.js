import {COLORS,validateMeld,solveRack} from '../engine.js';

/**
 * Whole-table exact-cover candidate search with an explicit node/candidate budget.
 * Every physical table tile is mandatory. Rack tiles are optional.
 * This is a bounded, anytime B&B solver, NOT a proven global optimum if capped.
 */
export function solveGlobalCover(board,rack,{maxTiles=38,maxNodes=1400,maxCandidates=12000,maxBranch=16}={}){
  const old=board.flat(),all=[...old,...rack],nb=old.length;
  if(!nb||!rack.length||all.length>maxTiles)return null;
  if(new Set(all.map(t=>t.id)).size!==all.length)throw Error('Duplicate tile ids in global cover');
  const key=new Map(),jokers=[];
  for(let i=0;i<all.length;i++){const t=all[i];if(t.color==='joker'){jokers.push(i);continue;}const k=t.color+':'+t.value;if(!key.has(k))key.set(k,[]);key.get(k).push(i);}
  const candidates=[],seen=new Set(),byOld=Array.from({length:nb},()=>[]);
  const add=indices=>{
    if(candidates.length>=maxCandidates)return;
    const canonical=indices.slice().sort((a,b)=>a-b).join(',');
    if(seen.has(canonical))return;
    const meld=indices.map(i=>all[i]);
    if(!validateMeld(meld).valid)return;
    seen.add(canonical);
    let mask=0n,rackUsed=0,oldUsed=0;
    for(const i of indices){mask|=1n<<BigInt(i);if(i>=nb)rackUsed++;else oldUsed++;}
    if(!oldUsed)return;
    const c={mask,tiles:meld,rackUsed,oldUsed};
    candidates.push(c);
    for(const i of indices)if(i<nb)byOld[i].push(c);
  };
  // Distinct-colour groups, including substitutions with up to two jokers.
  for(let value=1;value<=13;value++){
    const choices=COLORS.map(color=>key.get(color+':'+value)||[]);
    const natural=(c,indices)=>{
      if(indices.length>=1){for(let total=3;total<=4;total++){const missing=total-indices.length;if(missing<0||missing>jokers.length)continue;if(missing===0)add(indices);else if(missing===1)for(const j of jokers)add([...indices,j]);else for(let a=0;a<jokers.length;a++)for(let b=a+1;b<jokers.length;b++)add([...indices,jokers[a],jokers[b]]);}}
      if(c===4)return;
      natural(c+1,indices);
      for(const i of choices[c])natural(c+1,[...indices,i]);
    };
    natural(0,[]);
  }
  // Natural runs with physical duplicates and optional joker substitutions.
  for(const color of COLORS)for(let start=1;start<=11;start++){
    const walk=(value,indices,jUsed)=>{
      if(indices.length>=3)add(indices);
      if(value>13||indices.length>=13||candidates.length>=maxCandidates)return;
      for(const i of key.get(color+':'+value)||[])walk(value+1,[...indices,i],jUsed);
      if(jUsed<jokers.length)for(const j of jokers)if(!indices.includes(j))walk(value+1,[...indices,j],jUsed+1);
    };
    walk(start,[],0);
  }
  if(byOld.some(x=>!x.length))return null;
  const rank=(a,b)=>b.rackUsed-a.rackUsed||b.oldUsed-a.oldUsed||a.tiles.length-b.tiles.length;
  byOld.forEach(x=>x.sort(rank));
  let nodes=0,capped=candidates.length>=maxCandidates, best=null;
  // Complete a mandatory cover with ordinary rack melds and legal one-tile extensions.
  const finish=(parts,usedMask)=>{
    const table=parts.map(c=>c.tiles.slice()),left=rack.filter((t,i)=>!(usedMask&(1n<<BigInt(nb+i))));
    const extra=solveRack(left,true),usedExtra=new Set(extra.melds.flat().map(t=>t.id));
    table.push(...extra.melds.map(m=>m.slice()));
    let remainder=left.filter(t=>!usedExtra.has(t.id));
    for(let step=0;step<Math.min(29,remainder.length);step++){
      let chosen=null;
      for(let i=0;i<table.length;i++)for(const t of remainder)for(let pos=0;pos<=table[i].length;pos++){
        const m=table[i].slice();m.splice(pos,0,t);
        if(validateMeld(m).valid&&(!chosen||t.value>chosen.tile.value))chosen={i,m,tile:t};
      }
      if(!chosen)break;
      table[chosen.i]=chosen.m;
      remainder=remainder.filter(t=>t.id!==chosen.tile.id);
    }
    const used=rack.length-remainder.length;
    if(used>0&&(!best||used>best.used)){
      best={board:table,remaining:remainder,used,method:'global-cover-bounded'};
    }
  };
  const full=(1n<<BigInt(nb))-1n;
  const dfs=(mask,covered,parts,depth)=>{
    if(++nodes>maxNodes){capped=true;return;}
    if(covered===nb){finish(parts,mask);return;}
    const remainingRack=rack.length-Number((mask>>BigInt(nb)).toString(2).replace(/0/g,'').length);
    if(best?.used===rack.length||best&&parts.reduce((s,c)=>s+c.rackUsed,0)+remainingRack<=best.used&&depth>0)return;
    let chosen=null,smallest=Infinity;
    for(let i=0;i<nb;i++)if(!(mask&(1n<<BigInt(i)))){
      const options=byOld[i].filter(c=>(c.mask&mask)===0n);
      if(!options.length)return;
      if(options.length<smallest){smallest=options.length;chosen=options;if(smallest===1)break;}
    }
    for(const c of chosen.slice(0,maxBranch)){if(nodes>maxNodes)break;dfs(mask|c.mask,covered+c.oldUsed,[...parts,c],depth+1);}
    if(chosen.length>maxBranch)capped=true;
  };
  dfs(0n,0,[],0);
  if(!best)return null;
  const ids=best.board.flat().map(t=>t.id),placed=new Set(ids),required=new Set(old.map(t=>t.id));
  if(ids.length!==placed.size||[...required].some(id=>!placed.has(id))||best.board.some(m=>!validateMeld(m).valid)||best.remaining.some(t=>placed.has(t.id)))throw Error('Global cover violated tile conservation');
  return {...best,nodes,candidates:candidates.length,capped};
}
