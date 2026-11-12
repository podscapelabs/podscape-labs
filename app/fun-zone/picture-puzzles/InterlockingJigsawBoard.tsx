"use client";
import {useCallback,useEffect,useId,useMemo,useRef,useState} from "react";
import styles from "./picture-puzzles.module.css";

type PiecePosition={x:number;y:number;placed:boolean};
type Props={userId:string;id:string;imageUrl:string;imageAlt:string;size:number;onProgress?:(placed:number,total:number)=>void;onComplete?:(proof:{placed:number[];moves:number})=>void;onReset?:()=>void};
const WIDTH=600,BOARD=480,BOARD_X=60,BOARD_Y=35,TRAY_Y=595;
function seedSign(n:number){return ((n*37+17)%7)%2===0?1:-1;}
function pathForPiece(r:number,c:number,size:number){
 const unit=BOARD/size,x=BOARD_X+c*unit,y=BOARD_Y+r*unit;
 const point=(a:number,b:number)=>[Number(a.toFixed(2)),Number(b.toFixed(2))].join(" ");
 let d="M "+point(x,y);
 const edge=(sx:number,sy:number,ex:number,ey:number,sign:number)=>{
  if(sign===0){d+=" L "+point(ex,ey);return;}
  const dx=ex-sx,dy=ey-sy,nx=dy,ny=-dx;
  const p=(t:number,v:number)=>point(sx+dx*t+nx*v,sy+dy*t+ny*v);
  const s=sign;
  d+=" L "+p(.29,0);
  d+=" C "+p(.36,0)+" "+p(.34,.14*s)+" "+p(.40,.20*s);
  d+=" C "+p(.44,.30*s)+" "+p(.56,.30*s)+" "+p(.60,.20*s);
  d+=" C "+p(.66,.14*s)+" "+p(.64,0)+" "+p(.71,0);
  d+=" L "+p(1,0);
 };
 // Clockwise piece contours: each shared edge is the exact reverse of its neighbour.
 edge(x,y,x+unit,y,r===0?0:-seedSign((r-1)*size+c+11));
 edge(x+unit,y,x+unit,y+unit,c===size-1?0:seedSign(r*(size-1)+c+79));
 edge(x+unit,y+unit,x,y+unit,r===size-1?0:seedSign(r*size+c+11));
 edge(x,y+unit,x,y,c===0?0:-seedSign(r*(size-1)+c-1+79));
 return d+" Z";
}
function newPositions(size:number,randomize=true):PiecePosition[]{
 const count=size*size,cols=size===3?3:4,unit=BOARD/size,stepX=WIDTH/cols,stepY=unit*1.38;
 const indices=Array.from({length:count},(_,i)=>i);
 if(randomize)for(let i=count-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
 return indices.map(slot=>({x:stepX*(slot%cols)+(stepX-unit)/2,y:TRAY_Y+Math.floor(slot/cols)*stepY,placed:false}));
}
function isValidPositions(value:unknown,size:number):value is PiecePosition[]{
 const unit=BOARD/size;
 return Array.isArray(value)&&value.length===size*size&&value.every((p,i)=>{
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||typeof p.placed!=="boolean")return false;
  if(p.placed)return p.x===BOARD_X+(i%size)*unit&&p.y===BOARD_Y+Math.floor(i/size)*unit;
  return p.x>=0&&p.x<=WIDTH-unit&&p.y>=0&&p.y<=TRAY_Y+Math.ceil(size*size/(size===3?3:4))*unit*1.38+35-unit;
 });
}
export function InterlockingJigsawBoard({userId,id,imageUrl,imageAlt,size,onProgress,onComplete,onReset}:Props){
 const count=size*size,unit=BOARD/size,cols=size===3?3:4,rows=Math.ceil(count/cols);
 const height=TRAY_Y+rows*unit*1.38+35,root=useRef<SVGSVGElement>(null);
 const uid=useId().replace(/:/g,"");
 const [positions,setPositions]=useState<PiecePosition[]>(()=>newPositions(size,false));
 const [ready,setReady]=useState(false);
 const [moves,setMoves]=useState(0);
 const [active,setActive]=useState<number|null>(null);
 const completionSent=useRef(false);
 const drag=useRef<{index:number;pointerId:number;clientX:number;clientY:number;originX:number;originY:number;changed:boolean}|null>(null);
 // Keep the first server and client renders deterministic to avoid hydration errors.
 const key="podscape:jigsaw:v2:"+userId+":"+id+":"+size;
 const solved=positions.filter(p=>p.placed).length;
 const outline=useMemo(()=>Array.from({length:count},(_,i)=>pathForPiece(Math.floor(i/size),i%size,size)),[count,size]);
 const order=useMemo(()=>[...Array.from({length:count},(_,i)=>i).filter(i=>i!==active),...(active===null?[]:[active])],[count,active]);
 useEffect(()=>{
  try{const raw=localStorage.getItem(key);let restored=false;if(raw){const saved=JSON.parse(raw) as {positions:unknown;moves:number};if(isValidPositions(saved.positions,size)){setPositions(saved.positions);setMoves(Number.isSafeInteger(saved.moves)&&saved.moves>=0?saved.moves:0);restored=true;}}if(!restored)setPositions(newPositions(size));}catch{setPositions(newPositions(size));/* Local storage is optional */}
  setReady(true);
 },[key,size]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(key,JSON.stringify({positions,moves}));}catch{/* Local storage is optional */}},[key,ready,positions,moves]);
 useEffect(()=>{onProgress?.(solved,count);},[solved,count,onProgress]);
 useEffect(()=>{if(ready&&solved===count&&!completionSent.current){completionSent.current=true;onComplete?.({placed:Array.from({length:count},(_,i)=>i),moves});}},[ready,solved,count,moves,onComplete]);
 const startOver=useCallback(()=>{completionSent.current=false;setPositions(newPositions(size));setMoves(0);setActive(null);drag.current=null;onReset?.();},[size,onReset]);
 const target=(index:number)=>({x:BOARD_X+(index%size)*unit,y:BOARD_Y+Math.floor(index/size)*unit});
 function trySnap(index:number,x:number,y:number){
  const to=target(index);
  const near=Math.hypot(x-to.x,y-to.y)<unit*.42;
  setPositions(prev=>prev.map((p,i)=>i===index?(near?{...to,placed:true}:{...p,x,y}):p));
  if(near)setMoves(n=>n+1);
  setActive(null);
 }
 function down(event:React.PointerEvent<SVGGElement>,index:number){
  if(positions[index].placed)return;
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  const current=positions[index];
  drag.current={index,pointerId:event.pointerId,clientX:event.clientX,clientY:event.clientY,originX:current.x,originY:current.y,changed:false};
  setActive(index);
 }
 function move(event:React.PointerEvent<SVGGElement>){
  const d=drag.current;if(!d||d.pointerId!==event.pointerId||!root.current)return;
  const scale=WIDTH/root.current.getBoundingClientRect().width;
  const dx=(event.clientX-d.clientX)*scale,dy=(event.clientY-d.clientY)*scale;
  if(Math.abs(dx)+Math.abs(dy)>5)d.changed=true;
  setPositions(prev=>prev.map((p,i)=>i===d.index?{...p,x:Math.max(0,Math.min(WIDTH-unit,d.originX+dx)),y:Math.max(0,Math.min(height-unit,d.originY+dy))}:p));
 }
 function up(event:React.PointerEvent<SVGGElement>){
  const d=drag.current;if(!d||d.pointerId!==event.pointerId||!root.current)return;
  const scale=WIDTH/root.current.getBoundingClientRect().width;
  const x=Math.max(0,Math.min(WIDTH-unit,d.originX+(event.clientX-d.clientX)*scale)),y=Math.max(0,Math.min(height-unit,d.originY+(event.clientY-d.clientY)*scale));
  drag.current=null;
  if(d.changed)trySnap(d.index,x,y);else setActive(d.index);
 }
 function keyboard(event:React.KeyboardEvent<SVGGElement>,index:number){
  if(positions[index].placed)return;
  const delta=event.shiftKey?24:12;
  const movement:Record<string,[number,number]>={ArrowUp:[0,-delta],ArrowDown:[0,delta],ArrowLeft:[-delta,0],ArrowRight:[delta,0]};
  if(movement[event.key]){event.preventDefault();const [dx,dy]=movement[event.key];setPositions(prev=>prev.map((p,i)=>i===index?{...p,x:Math.max(0,Math.min(WIDTH-unit,p.x+dx)),y:Math.max(0,Math.min(height-unit,p.y+dy))}:p));setActive(index);}
  else if(event.key==="Enter"||event.key===" "){event.preventDefault();trySnap(index,positions[index].x,positions[index].y);}
 }
 return <div className={styles.jigsawShell}>
  <div className={styles.jigsawStatus}><strong>{solved} / {count} pieces placed</strong><span>{moves} snapped pieces</span></div>
  <p className={styles.helper}>Drag interlocking pieces from the tray onto their matching positions. Pieces snap into place when close enough. On a keyboard, use arrow keys to move a focused piece and Enter to snap it.</p>
  <div className={styles.jigsawCanvas}>
   <svg ref={root} viewBox={`0 0 ${WIDTH} ${height}`} xmlns="http://www.w3.org/2000/svg" role="group" aria-label={"Interactive jigsaw of "+imageAlt} className={styles.jigsawSvg}>
    <defs>{outline.map((d,i)=><clipPath key={i} id={uid+"-p-"+i} clipPathUnits="userSpaceOnUse"><path d={d}/></clipPath>)}</defs>
    <rect x={BOARD_X} y={BOARD_Y} width={BOARD} height={BOARD} rx="4" fill="var(--surface-secondary)" stroke="var(--border)" strokeWidth="3"/>
    <text x="18" y="570" fill="var(--text-secondary)" fontSize="19" fontWeight="700">YOUR PIECES</text>
    {order.map(i=>{
     const p=positions[i],to=target(i),tx=p.x-to.x,ty=p.y-to.y;
     return <g key={i} transform={`translate(${tx} ${ty})`} role="button" tabIndex={p.placed?-1:0} aria-label={`Jigsaw piece ${i+1} of ${count}${p.placed?", placed":""}`} aria-disabled={p.placed} onPointerDown={e=>down(e,i)} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drag.current=null;setActive(null);}} onKeyDown={e=>keyboard(e,i)} className={p.placed?styles.jigsawPlaced:styles.jigsawPiece}>
      <g clipPath={`url(#${uid}-p-${i})`}>
       <image href={imageUrl} x={BOARD_X} y={BOARD_Y} width={BOARD} height={BOARD} preserveAspectRatio="xMidYMid slice" pointerEvents="none"/>
       <path d={outline[i]} fill="transparent" stroke="none"/>
      </g>
      <path d={outline[i]} fill="none" stroke={p.placed?"var(--accent)":"var(--text-primary)"} strokeWidth={p.placed?1.3:2.8} strokeLinejoin="round" pointerEvents="visibleStroke"/>
      <path d={outline[i]} fill="transparent" stroke="none" pointerEvents="visibleFill"/>
     </g>;
    })}
   </svg>
  </div>
  {solved===count?<p className={styles.win} role="status">Jigsaw complete! Every piece has found its place. 🧩</p>:null}
  <div className={styles.controls}><button type="button" onClick={startOver}>Shuffle pieces again</button></div>
  <details className={styles.jigsawReference}><summary>View original artwork</summary><div className={styles.fullImage} role="img" aria-label={imageAlt} style={{backgroundImage:`url("${imageUrl}")`}}/></details>
  <p className={styles.note}>The board starts blank: build the picture by fitting its interlocking pieces together. Progress is saved on this device.</p>
 </div>;
}
