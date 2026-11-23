import {orderedMeld} from './tile-layout.js';
/** Immutable, reversible turn drafts. Board groups may be temporarily incomplete. */
const COPY = state => ({board:state.board.map(group=>({key:group.key,tiles:group.tiles.slice()})),rack:state.rack.slice(),serial:state.serial});
export function startDraft(game,player=0){return{board:game.board.map((tiles,i)=>({key:'original-'+i,tiles:tiles.slice()})),rack:game.racks[player].slice(),serial:0};}
export function copyDraft(state){return COPY(state);}
export function draftTileIds(state){return [...state.rack,...state.board.flatMap(group=>group.tiles)].map(tile=>tile.id);}
export function moveTiles(state,ids,target,lockedIds=[]){
  const chosen=[...new Set(ids)];
  if(!chosen.length)return{ok:false,reason:'이동할 타일을 선택하세요.'};
  const positions=new Map();
  state.rack.forEach((tile,index)=>positions.set(tile.id,{source:'rack',index,tile}));
  state.board.forEach(group=>group.tiles.forEach((tile,index)=>positions.set(tile.id,{source:'board',key:group.key,index,tile})));
  if(chosen.some(id=>!positions.has(id)))return{ok:false,reason:'선택한 타일이 현재 게임판에 없습니다.'};
  const locked=new Set(lockedIds);
  if(target.kind==='rack'&&chosen.some(id=>locked.has(id)))return{ok:false,reason:'원래 테이블의 타일은 손패로 가져올 수 없습니다.'};
  if(target.kind==='meld'&&!state.board.some(group=>group.key===target.key))return{ok:false,reason:'대상 조합이 없습니다.'};
  if(!['rack','meld','board'].includes(target.kind))return{ok:false,reason:'타일을 놓을 위치가 올바르지 않습니다.'};
  const originals=chosen.map(id=>positions.get(id).tile);
  const before=target.kind==='meld'?state.board.find(group=>group.key===target.key):null;
  const oldLength=before?before.tiles.length:state.rack.length;
  const requested=Math.max(0,Math.min(oldLength,Number.isFinite(target.index)?target.index:oldLength));
  const removedBefore=chosen.filter(id=>{const p=positions.get(id);return target.kind==='rack'?p.source==='rack'&&p.index<requested:p.source==='board'&&p.key===target.key&&p.index<requested;}).length;
  const next=COPY(state),chosenIds=new Set(chosen);
  next.rack=next.rack.filter(t=>!chosenIds.has(t.id));
  next.board=next.board.map(group=>({...group,tiles:group.tiles.filter(t=>!chosenIds.has(t.id))})).filter(group=>group.tiles.length);
  if(target.kind==='rack'){next.rack.splice(requested-removedBefore,0,...originals);}
  else if(target.kind==='board'){next.board.push({key:'draft-'+next.serial++,tiles:orderedMeld(originals)});}
  else {let group=next.board.find(group=>group.key===target.key);if(!group){group={key:target.key,tiles:[]};next.board.splice(Math.min(state.board.findIndex(g=>g.key===target.key),next.board.length),0,group);}group.tiles.splice(Math.max(0,requested-removedBefore),0,...originals);group.tiles=orderedMeld(group.tiles);}
  return{ok:true,state:next};
}
export function sortDraftRack(state,mode='color'){const next=COPY(state),order=['red','blue','yellow','black','joker'];if(mode==='number')next.rack.sort((a,b)=>(a.value||99)-(b.value||99)||order.indexOf(a.color)-order.indexOf(b.color)||a.id.localeCompare(b.id));else next.rack.sort((a,b)=>order.indexOf(a.color)-order.indexOf(b.color)||a.value-b.value||a.id.localeCompare(b.id));return next;}
export function makeHistory(state){return{snapshots:[COPY(state)],cursor:0};}
export function recordHistory(history,state,limit=100){const snapshots=history.snapshots.slice(0,history.cursor+1);snapshots.push(COPY(state));if(snapshots.length>limit+1)snapshots.splice(0,snapshots.length-limit-1);return{snapshots,cursor:snapshots.length-1};}
export function undoHistory(history){if(history.cursor===0)return{history,state:COPY(history.snapshots[0]),changed:false};const next={...history,cursor:history.cursor-1};return{history:next,state:COPY(next.snapshots[next.cursor]),changed:true};}
export function redoHistory(history){if(history.cursor>=history.snapshots.length-1)return{history,state:COPY(history.snapshots[history.cursor]),changed:false};const next={...history,cursor:history.cursor+1};return{history:next,state:COPY(next.snapshots[next.cursor]),changed:true};}
