"use client";
import {useEffect,useRef,useState,type PointerEvent,type MouseEvent,type ReactNode} from "react";
import styles from "./PodscapeHome.module.css";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {EDIT_HOLD_MS,EDIT_MOVE_CANCEL_PX,EDIT_CLICK_SUPPRESS_MS} from "./workspace-edit-standards";

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
 const before=new Map(nodes.map(node=>[node,node.getBoundingClientRect()]));
 change();
 requestAnimationFrame(()=>{
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  for(const node of nodes){
   if(!node.isConnected)continue;
   const previous=before.get(node);
   if(previous===undefined)continue;
   const next=node.getBoundingClientRect();
   const dx=previous.left-next.left,dy=previous.top-next.top;
   if(Math.abs(dx)<3&&Math.abs(dy)<3)continue;
   // FLIP animation: layout has already changed; settle neighbouring cards into place.
   node.animate([{transform:`translate3d(${dx}px,${dy}px,0)`},{transform:"translate3d(0,0,0)"}],
    {duration:220,easing:"cubic-bezier(.2,.85,.25,1)"});
  }
 });
}

type DragState<T extends string>={
 id:T;pointerId:number;startX:number;startY:number;startScrollY:number;
 lastClientX:number;lastClientY:number;started:boolean;swapAnchorX:number;swapAnchorY:number;lastSwapAt:number;
};
export function useWorkspaceDrag<T extends string>(
 scope:string,visible:readonly T[],reorder:(from:T,to:T)=>void
){
 const current=useRef<DragState<T>|null>(null);
 const scrollFrame=useRef<number|null>(null);
 const visibleRef=useRef(visible);
 const reorderRef=useRef(reorder);
 visibleRef.current=visible;
 reorderRef.current=reorder;
 const [dragging,setDragging]=useState<T|null>(null);

 // Drag distance is measured in page coordinates, not just client pixels.
 // Auto-scroll therefore keeps moving widgets even while the finger is still.
 const trySwap=(drag:DragState<T>)=>{
  const position=drag.lastClientY+(window.scrollY-drag.startScrollY);
  const distance=position-drag.swapAnchorY;
  const horizontalDistance=drag.lastClientX-drag.swapAnchorX;
  const orderBefore=visibleRef.current;
  const currentIndex=orderBefore.indexOf(drag.id);
  const nodes=workspaceNodes(scope);
  const moving=nodes.find(node=>node.dataset.workspaceBlock===drag.id);
  const neighbor=nodes.find(node=>node.dataset.workspaceBlock===orderBefore[currentIndex+(horizontalDistance>0?1:-1)]);
  const sameRow=Boolean(moving&&neighbor&&Math.abs(moving.getBoundingClientRect().top-neighbor.getBoundingClientRect().top)<20);
  const horizontal=sameRow&&Math.abs(horizontalDistance)>Math.abs(distance)*1.2;
  const movement=horizontal?horizontalDistance:distance;
  const direction=movement>0?1:-1;
  if(Math.abs(movement)<16){clearDropPreview(scope);return;}
  // Wait for React to settle a swap before reading the next order.
  if(performance.now()-drag.lastSwapAt<125)return;
  const order=visibleRef.current;
  const from=order.indexOf(drag.id),to=from+direction;
  if(from<0||to<0||to>=order.length){clearDropPreview(scope);return;}
  const target=order[to];
  clearDropPreview(scope);
  workspaceNodes(scope).find(node=>node.dataset.workspaceBlock===target)
   ?.setAttribute("data-workspace-drop-preview",direction>0?"after":"before");
  if(Math.abs(movement)<42)return;
  drag.swapAnchorY=position;
  drag.swapAnchorX=drag.lastClientX;
  drag.lastSwapAt=performance.now();
  animatedReorder(scope,()=>reorderRef.current(drag.id,target));
 };
 const scrollTick=()=>{
  const drag=current.current;
  if(!drag?.started){scrollFrame.current=null;return;}
  const upper=130,lower=Math.max(upper+80,window.innerHeight-130);
  const amount=drag.lastClientY<upper?-Math.min(18,Math.max(3,(upper-drag.lastClientY)*.16))
   :drag.lastClientY>lower?Math.min(18,Math.max(3,(drag.lastClientY-lower)*.16)):0;
  if(!amount){scrollFrame.current=null;return;}
  const previous=window.scrollY;
  // Directly updating the scroll position avoids the site's smooth-scroll CSS
  // delaying a drag and causing oscillation in the landing position.
  if(document.scrollingElement)document.scrollingElement.scrollTop+=amount;
  if(window.scrollY!==previous){
   trySwap(drag);
   scrollFrame.current=requestAnimationFrame(scrollTick);
  }else scrollFrame.current=null;
 };
 useEffect(()=>()=>{if(scrollFrame.current!==null)cancelAnimationFrame(scrollFrame.current)},[]);
 const begin=(id:T,event:PointerEvent<HTMLDivElement>)=>{
  if(event.pointerType==="mouse"&&event.button!==0)return;
  if(!(event.target as HTMLElement).closest("[data-drag-handle]"))return;
  current.current={
   id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,
   startScrollY:window.scrollY,lastClientX:event.clientX,lastClientY:event.clientY,started:false,
   swapAnchorX:event.clientX,swapAnchorY:event.clientY,lastSwapAt:0
  };
  const root=event.currentTarget.closest<HTMLElement>("[data-workspace-root]");
  // Keep capturing on the stationary canvas: the dragged block itself moves.
  try{(root||event.currentTarget).setPointerCapture(event.pointerId)}catch{}
 };
 const move=(event:PointerEvent<HTMLElement>)=>{
  const drag=current.current;
  if(!drag||drag.pointerId!==event.pointerId)return;
  drag.lastClientX=event.clientX;drag.lastClientY=event.clientY;
  if(!drag.started){
   if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6)return;
   drag.started=true;
   setDragging(drag.id);
  }
  trySwap(drag);
  if(scrollFrame.current===null)scrollFrame.current=requestAnimationFrame(scrollTick);
 };
 const stop=()=>{
  clearDropPreview(scope);
  current.current=null;
  if(scrollFrame.current!==null)cancelAnimationFrame(scrollFrame.current);
  scrollFrame.current=null;
  setDragging(null);
 };
 return {dragging,begin,move,stop};
}
export function WorkspaceEditToolbar({title,description,onAdd,onReset,onDone}:{title:string;description:string;onAdd:()=>void;onReset:()=>void;onDone:()=>void}){
 return <div className={styles.homeCanvasToolbar} role="toolbar" aria-label={title}>
  <div><strong>{title}</strong><small>{description}</small></div>
  <button type="button" onClick={onAdd}><PodscapeLineIcon name="grid"/> Add Widgets</button>
  <button type="button" onClick={onReset}>Reset to Default</button>
  <button type="button" onClick={onDone}><PodscapeLineIcon name="check"/> Done</button>
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
  if(!onLongPress||event.pointerType==="mouse")return;
  // Shortcut tiles own their jiggle gesture. Do not let the parent widget's
  // long-press timer intercept them before their shortcut editor activates.
  if((event.target as HTMLElement).closest("[data-shortcut-index]"))return;
  // Do not intercept controls such as forms, selection, or nested editable areas.
  if((event.target as HTMLElement).closest("input,textarea,select,button,[role='button'],[contenteditable='true']"))return;
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
  },EDIT_HOLD_MS);
 };
 const onPressMove=(event:PointerEvent<HTMLDivElement>)=>{
  if(editing){move(event);return}
  const pending=press.current;
  if(pending&&pending.pointerId===event.pointerId&&Math.hypot(event.clientX-pending.x,event.clientY-pending.y)>EDIT_MOVE_CANCEL_PX)cancelPress();
 };
 const endPress=()=>{
  if(activatedPointer.current!==null){
   activatedPointer.current=null;
   if(clickReset.current!==null)clearTimeout(clickReset.current);
   // Safari may emit a synthetic click shortly after pointerup.
   clickReset.current=setTimeout(()=>{blockClicks.current=false;clickReset.current=null},EDIT_CLICK_SUPPRESS_MS);
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
   if(onLongPress && !(event.target as HTMLElement).closest("input,textarea,select,button,[role='button'],[contenteditable='true']"))event.preventDefault();
  }}
  onDragStartCapture={event=>{if(onLongPress)event.preventDefault()}}>
  {editing?<div className={styles.homeCanvasBlockBar}>
    <button type="button" data-drag-handle="true" className={styles.homeCanvasHandle} aria-label={`Drag ${label} to reorder`}><PodscapeLineIcon name="grip"/> {label}</button>
    <div><button type="button" aria-label={`Move ${label} up`} disabled={index===0} onClick={()=>animatedReorder(scope,()=>onMove(id,-1))}><PodscapeLineIcon name="arrow-up"/></button>
    <button type="button" aria-label={`Move ${label} down`} disabled={index===count-1} onClick={()=>animatedReorder(scope,()=>onMove(id,1))}><PodscapeLineIcon name="arrow-down"/></button>
    {!required&&onRemove?<button type="button" aria-label={`Remove ${label}`} onClick={()=>onRemove(id)}><PodscapeLineIcon name="close"/></button>:null}</div>
  </div>:null}
  <div className={editing&&!interactiveChildren?styles.homeCanvasContentLocked:undefined}>{children}</div>
 </div>;
}
