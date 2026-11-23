import {trailingGroup} from './tile-layout.js';
/** Only tiles immediately following the held tile, in the current visual order. */
export function collectHold(state,tileId,zone,columns=7){if(zone==='rack'){const idx=state.rack.findIndex(t=>t.id===tileId);return trailingGroup(state.rack,idx,Math.max(1,columns)).map(t=>t.id);}const meld=state.board.find(group=>group.tiles.some(t=>t.id===tileId));if(!meld)return[];return trailingGroup(meld.tiles,meld.tiles.findIndex(t=>t.id===tileId)).map(t=>t.id);}
