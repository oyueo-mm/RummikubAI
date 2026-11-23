/** Quiet synthesized tile effects; audio initializes on first user gesture. */
export const SOUNDS={pick:[[400,.025,.018]],add:[[530,.024,.015]],remove:[[320,.024,.012]],drop:[[330,.025,.017],[450,.032,.013,.029]],undo:[[300,.045,.015]],draw:[[350,.032,.014]],commit:[[460,.047,.019],[620,.062,.015,.052]],error:[[190,.065,.013]],win:[[440,.055,.018],[550,.065,.017,.065],[660,.09,.015,.14]],ai:[[360,.034,.010]]};
export function createSoundSystem({AudioContextCtor=null,storage=null}={}){
  let context=null;let enabled=true;try{enabled=storage?.getItem('rummikubai-sound')!=='off';}catch{}
  function unlock(){if(!enabled||!AudioContextCtor)return null;try{if(!context)context=new AudioContextCtor();if(context.state==='suspended')context.resume?.().catch?.(()=>{});return context;}catch{return null;}}
  function play(kind){if(!enabled)return false;const ctx=unlock(),notes=SOUNDS[kind];if(!ctx||!notes)return false;try{for(const [freq,duration,volume,delay=0] of notes){const o=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+delay;o.type='sine';o.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(volume,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(gain);gain.connect(ctx.destination);o.start(start);o.stop(start+duration+.005);}return true;}catch{return false;}}
  function setEnabled(value){enabled=!!value;try{storage?.setItem('rummikubai-sound',enabled?'on':'off');}catch{}return enabled;}
  return{play,unlock,setEnabled,isEnabled:()=>enabled};
}
