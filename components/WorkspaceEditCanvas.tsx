"use client";
import {useEffect,useRef,useState,type PointerEvent,type MouseEvent,type ReactNode} from "react";
import styles from "./PodscapeHome.module.css";

/** Animate layout changes without moving or replacing the real interactive widgets. */
function workspaceNodes(scope:string){
 return Array.from(document.querySelectorAll<HTMLElement>("[data-workspace-scope]"))
  .filter(node=>node.dataset.workspaceScope===scope);
}
function clearDropPreview(scope:string){
 for(const node of workspaceNodes(scope))node.removeAttribute("data-workspace-drop-preview");
}
function animatedReorder(scope:string,change:()=>void){
 const nodes=workspaceNodes(scope);
 const before=new Map(nodes.map(node=>[node,node.getBoundingClientRect().top]));
 change();
 requestAnimationFrame(()=>{
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  for(const node of nodes){
   if(!node.isConnected)continue;
   const previous=before.get(node);
   if(previous===undefined)continue;
   const delta=previous-node.getBoundingClientRect().top;
   if(Math.abs(delta)<3)continue;
   // FLIP animation: layout has already changed; settle neighbouring cards into place.
   node.animate([{transform:`translate3d(0,${delta}px,0)`},{transform:"translate3d(0,0,0)"}],
    {duration:220,easing:"cubic-bezier(.2,.85,.25,1)"});
  }
 });
}

type DragState<T extends string>={id:T;pointerId:number;startX:number;startY:number;lastY:number;started:boolean;lastSwapY:number|null};
export function useWorkspaceDrag<T extends string>(
  scope:string,visible:readonly T[],reorder:(from:T,to:T)=>void
){
  const current=useRef<DragState<T>|null>(null);
  const [dragging,setDragging]=useState<T|null>(null);
  const begin=(id:T,event:PointerEvent<HTMLDivElement>)=>{
    if(event.pointerType==="mouse"&&event.button!==0)return;
    // The arrows remain independent of dragging. Only the handle starts a drag.
    if(!(event.target as HTMLElement).closest("[data-drag-handle]"))return;
    current.current={id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,lastY:event.clientY,started:false,lastSwapY:null};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move=(event:PointerEvent<HTMLDivElement>)=>{
    const drag=current.current;
    if(!drag||drag.pointerId!==event.pointerId)return;
    if(!drag.started){
      if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6)return;
      drag.started=true;setDragging(drag.id);
    }
    // iOS edits happen inside a small viewport with a top toolbar and bottom nav.
    // Start scrolling before reaching either extreme, in BOTH directions.
    const topEdge=145,bottomEdge=window.innerHeight-155;
    if(event.clientY<topEdge)window.scrollBy(0,-Math.min(22,Math.max(7,(topEdge-event.clientY)*.25)));
    else if(event.clientY>bottomEdge)window.scrollBy(0,Math.min(22,Math.max(7,(event.clientY-bottomEdge)*.25)));

    const delta=event.clientY-drag.lastY;
    drag.lastY=event.clientY;
    if(Math.abs(delta)<1.5)return;
    const direction=delta>0?1:-1;
    // Prevent a swap from immediately flipping back when React reflows blocks
    // beneath a stationary finger. A deliberate reverse movement still works.
    if(drag.lastSwapY!==null&&direction*(event.clientY-drag.lastSwapY)<0&&Math.abs(event.clientY-drag.lastSwapY)<32)return;

    const nodes=Array.from(document.querySelectorAll<HTMLElement>("[data-workspace-scope]"))
      .filter(node=>node.dataset.workspaceScope===scope);
    const from=visible.indexOf(drag.id);
    const to=from+direction;
    if(from<0||to<0||to>=visible.length)return;
    const neighbor=nodes.find(node=>node.dataset.workspaceBlock===visible[to]);
    if(!neighbor)return;
    const rect=neighbor.getBoundingClientRect();
    // Trigger near the neighboring block's EDGE, not at the midpoint.
    // Large widgets may be hundreds of pixels tall; halfway was far too deep.
    const threshold=Math.min(36,rect.height*.12);
    const crossed=direction>0
      ?event.clientY>=rect.top+threshold
      :event.clientY<=rect.bottom-threshold;
    clearDropPreview(scope);
    neighbor.setAttribute("data-workspace-drop-preview",direction>0?"after":"before");
    if(!crossed)return;
    drag.lastSwapY=event.clientY;
    clearDropPreview(scope);
    animatedReorder(scope,()=>reorder(drag.id,visible[to]));
  };
  const stop=()=>{clearDropPreview(scope);current.current=null;setDragging(null)};
  return {dragging,begin,move,stop};
}
export function WorkspaceEditToolbar({title,description,onAdd,onReset,onDone}:{title:string;description:string;onAdd:()=>void;onReset:()=>void;onDone:()=>void}){
 return <div className={styles.homeCanvasToolbar} role="toolbar" aria-label={title}>
  <div><strong>{title}</strong><small>{description}</small></div>
  <button type="button" onClick={onAdd}>+ Widgets</button>
  <button type="button" onClick={onReset}>Reset to Default</button>
  <button type="button" onClick={onDone}>Done</button>
 </div>;
}
export function WorkspaceEditBlock<T extends string>({id,scope,label,index,count,editing,dragging,required,onMove,onRemove,begin,move,stop,onLongPress,interactiveChildren=false,children}:{
 id:T;scope:string;label:string;index:number;count:number;editing:boolean;dragging:boolean;required:boolean;
 onMove:(id:T,dir:number)=>void;onRemove?:(id:T)=>void;
 begin:(id:T,event:PointerEvent<HTMLDivElement>)=>void;move:(event:PointerEvent<HTMLDivElement>)=>void;stop:()=>void;onLongPress?:()=>void;interactiveChildren?:boolean;children:ReactNode;
}){
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const press=useRef<{pointerId:number;x:number;y:number}|null>(null);
 const blockClicks=useRef(false);
 const clickReset=useRef<ReturnType<typeof setTimeout>|null>(null);
 const activatedPointer=useRef<number|null>(null);
 const cancelPress=()=>{
  if(timer.current!==null){clearTimeout(timer.current);timer.current=null}
  press.current=null;
 };
 useEffect(()=>()=>{cancelPress();if(clickReset.current!==null)clearTimeout(clickReset.current)},[]);
 const onPressStart=(event:PointerEvent<HTMLDivElement>)=>{
  if(editing){begin(id,event);return}
  if(!onLongPress||(event.pointerType==="mouse"&&event.button!==0))return;
  // Do not intercept controls such as forms, selection, or nested editable areas.
  if((event.target as HTMLElement).closest("input,textarea,select,[contenteditable='true']"))return;
  cancelPress();
  const pointerId=event.pointerId;
  press.current={pointerId,x:event.clientX,y:event.clientY};
  timer.current=setTimeout(()=>{
   if(!press.current||press.current.pointerId!==pointerId)return;
   timer.current=null;
   blockClicks.current=true;
   activatedPointer.current=pointerId;
   if(clickReset.current!==null){clearTimeout(clickReset.current);clickReset.current=null}
   // Keep click suppression armed until after release, even for very long holds.
   onLongPress();
  },450);
 };
 const onPressMove=(event:PointerEvent<HTMLDivElement>)=>{
  if(editing){move(event);return}
  const pending=press.current;
  if(pending&&pending.pointerId===event.pointerId&&Math.hypot(event.clientX-pending.x,event.clientY-pending.y)>11)cancelPress();
 };
 const endPress=()=>{
  if(activatedPointer.current!==null){
   activatedPointer.current=null;
   if(clickReset.current!==null)clearTimeout(clickReset.current);
   // Safari may emit a synthetic click shortly after pointerup.
   clickReset.current=setTimeout(()=>{blockClicks.current=false;clickReset.current=null},1100);
  }
  cancelPress();stop();
 };
 const suppressClick=(event:MouseEvent<HTMLDivElement>)=>{
  if(!blockClicks.current)return;
  event.preventDefault();
  event.stopPropagation();
  blockClicks.current=false;
  if(clickReset.current!==null){clearTimeout(clickReset.current);clickReset.current=null}
 };
 return <div data-workspace-scope={scope} data-workspace-block={id} className={`${styles.homeCanvasBlock} ${editing?styles.homeCanvasBlockActive:""} ${dragging?styles.homeCanvasDragging:""}`}
  onPointerDown={onPressStart} onPointerMove={onPressMove} onPointerUp={endPress} onPointerCancel={endPress} onPointerLeave={cancelPress} onClickCapture={suppressClick}
  onContextMenuCapture={event=>{
   // On iOS a link preview may appear before the hold timer fires. Editable
   // workspace blocks own this gesture, including their nested anchors.
   if(onLongPress && !(event.target as HTMLElement).closest("input,textarea,select,[contenteditable='true']"))event.preventDefault();
  }}
  onDragStartCapture={event=>{if(onLongPress)event.preventDefault()}}>
  {editing?<div className={styles.homeCanvasBlockBar}>
    <button type="button" data-drag-handle="true" className={styles.homeCanvasHandle} aria-label={`Drag ${label} to reorder`}><span aria-hidden="true">⠿</span> {label}</button>
    <div><button type="button" aria-label={`Move ${label} up`} disabled={index===0} onClick={()=>animatedReorder(scope,()=>onMove(id,-1))}>↑</button>
    <button type="button" aria-label={`Move ${label} down`} disabled={index===count-1} onClick={()=>animatedReorder(scope,()=>onMove(id,1))}>↓</button>
    {!required&&onRemove?<button type="button" aria-label={`Remove ${label}`} onClick={()=>onRemove(id)}>×</button>:null}</div>
  </div>:null}
  <div className={editing&&!interactiveChildren?styles.homeCanvasContentLocked:undefined}>{children}</div>
 </div>;
}
