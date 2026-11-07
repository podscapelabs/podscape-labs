"use client";
import {useEffect,useRef,useState,type PointerEvent,type MouseEvent,type ReactNode} from "react";
import styles from "./PodscapeHome.module.css";

type DragState<T extends string>={id:T;pointerId:number;startX:number;startY:number;started:boolean};
export function useWorkspaceDrag<T extends string>(
  scope:string,visible:readonly T[],reorder:(from:T,to:T)=>void
){
  const current=useRef<DragState<T>|null>(null);
  const [dragging,setDragging]=useState<T|null>(null);
  const begin=(id:T,event:PointerEvent<HTMLDivElement>)=>{
    if(event.pointerType==="mouse"&&event.button!==0)return;
    if((event.target as HTMLElement).closest("button:not([data-drag-handle])"))return;
    current.current={id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,started:false};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move=(event:PointerEvent<HTMLDivElement>)=>{
    const drag=current.current;
    if(!drag||drag.pointerId!==event.pointerId)return;
    if(!drag.started){
      if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<7)return;
      drag.started=true;setDragging(drag.id);
    }
    const edge=88;
    if(event.clientY<edge)window.scrollBy(0,-12);
    else if(event.clientY>window.innerHeight-edge)window.scrollBy(0,12);
    const nodes=Array.from(document.querySelectorAll<HTMLElement>("[data-workspace-scope]"));
    const target=nodes.find(node=>{
      if(node.dataset.workspaceScope!==scope||node.dataset.workspaceBlock===drag.id)return false;
      const rect=node.getBoundingClientRect();
      return event.clientY>=rect.top&&event.clientY<=rect.bottom;
    });
    const targetId=target?.dataset.workspaceBlock as T|undefined;
    if(!targetId||!visible.includes(targetId))return;
    const rect=target!.getBoundingClientRect();
    const from=visible.indexOf(drag.id),to=visible.indexOf(targetId);
    if((from<to&&event.clientY<rect.top+rect.height*.52)||
       (from>to&&event.clientY>rect.top+rect.height*.48))return;
    reorder(drag.id,targetId);
  };
  const stop=()=>{current.current=null;setDragging(null)};
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
export function WorkspaceEditBlock<T extends string>({id,scope,label,index,count,editing,dragging,required,onMove,onRemove,begin,move,stop,onLongPress,children}:{
 id:T;scope:string;label:string;index:number;count:number;editing:boolean;dragging:boolean;required:boolean;
 onMove:(id:T,dir:number)=>void;onRemove?:(id:T)=>void;
 begin:(id:T,event:PointerEvent<HTMLDivElement>)=>void;move:(event:PointerEvent<HTMLDivElement>)=>void;stop:()=>void;onLongPress?:()=>void;children:ReactNode;
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
    <div><button type="button" aria-label={`Move ${label} up`} disabled={index===0} onClick={()=>onMove(id,-1)}>↑</button>
    <button type="button" aria-label={`Move ${label} down`} disabled={index===count-1} onClick={()=>onMove(id,1)}>↓</button>
    {!required&&onRemove?<button type="button" aria-label={`Remove ${label}`} onClick={()=>onRemove(id)}>×</button>:null}</div>
  </div>:null}
  <div className={editing?styles.homeCanvasContentLocked:undefined}>{children}</div>
 </div>;
}
