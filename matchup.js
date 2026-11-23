/** Pair games by initial seed and swap the physical seats of model A/B. */
export function matchupPlayers(a,b,gameIndex){if(!Number.isSafeInteger(gameIndex)||gameIndex<0)throw Error('Invalid game index');return gameIndex%2===0?[a,b]:[b,a];}
export function matchupSeed(baseSeed,gameIndex){if(!Number.isSafeInteger(baseSeed)||!Number.isSafeInteger(gameIndex)||baseSeed<0||gameIndex<0)throw Error('Invalid matchup seed');return baseSeed+Math.floor(gameIndex/2);}
export function matchupWinner(winner,gameIndex){if(winner===null)return'draw';if(winner!==0&&winner!==1)throw Error('Invalid winner seat');return winner===gameIndex%2?'a':'b';}
