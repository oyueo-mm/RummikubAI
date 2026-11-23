import {COLORS,validateMeld} from './engine.js';
/** Fast, local long-press choices. Only visible rack tiles are inspected. */
export function findHoldOptions(rack,anchorId,limit=6){
  const anchor=rack.find(t=>t.id===anchorId);if(!anchor)return[];
  const jokers=rack.filter(t=>t.color==='joker');const found=new Map();
  const add=(tiles)=>{if(tiles.length<3||!tiles.some(t=>t.id===anchorId))return;const v=validateMeld(tiles);if(!v.valid)return;const ids=tiles.map(t=>t.id),key=ids.slice().sort().join('|'),candidate={ids,tiles:tiles.slice(),type:v.type,points:v.score,jokers:tiles.filter(t=>t.color==='joker').length};const old=found.get(key);if(!old||candidate.points>old.points)found.set(key,candidate);};
  const values=anchor.color==='joker'?Array.from({length:13},(_,i)=>i+1):[anchor.value];
  for(const value of values){
    const possibilities=COLORS.map(color=>rack.filter(t=>t.color===color&&t.value===value)).map((matches,i)=>{if(anchor.color===COLORS[i])return matches.filter(t=>t.id===anchorId).slice(0,1);return matches.slice(0,1);});
    const pick=(i,naturals)=>{if(i===COLORS.length){for(let total=3;total<=4;total++){const required=total-naturals.length;if(required<0||required>jokers.length||!naturals.length)continue;const jokerChoices=required===0?[[]]:required===1?jokers.map(j=>[j]):jokers.length===2?[[...jokers]]:[];for(const chosenJokers of jokerChoices)add([...naturals,...chosenJokers]);}return;}pick(i+1,naturals);for(const t of possibilities[i])pick(i+1,[...naturals,t]);};
    pick(0,[]);
  }
  for(const color of COLORS){
    if(anchor.color!=='joker'&&anchor.color!==color)continue;
    const available=new Map();for(let v=1;v<=13;v++){const matches=rack.filter(t=>t.color===color&&t.value===v);if(anchor.color===color&&anchor.value===v)available.set(v,matches.filter(t=>t.id===anchorId).slice(0,1));else available.set(v,matches.slice(0,1));}
    for(let start=1;start<=11;start++){
      const search=(value,tiles,usedJokers)=>{if(tiles.length>=3)add(tiles);if(value>13)return;const natural=available.get(value)||[];for(const t of natural)search(value+1,[...tiles,t],usedJokers);for(const joker of jokers)if(!usedJokers.has(joker.id)){const next=new Set(usedJokers);next.add(joker.id);search(value+1,[...tiles,joker],next);}};
      search(start,[],new Set());
    }
  }
  return [...found.values()].sort((a,b)=>b.ids.length-a.ids.length||a.jokers-b.jokers||b.points-a.points||a.ids.join('|').localeCompare(b.ids.join('|'))).slice(0,Math.max(1,limit));
}
export function getHoldOptions(state,tileId,limit=6){
  const boardGroup=state.board.find(group=>group.tiles.some(t=>t.id===tileId));
  if(boardGroup)return[{ids:boardGroup.tiles.map(t=>t.id),tiles:boardGroup.tiles.slice(),type:'board',points:0,jokers:boardGroup.tiles.filter(t=>t.color==='joker').length,key:boardGroup.key}];
  return findHoldOptions(state.rack,tileId,limit);
}
