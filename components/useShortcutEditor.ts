"use client";
import {useEffect,useRef,useState} from "react";
import {moveNavigationSlot} from "./navigation-customization";
import {EDIT_HOLD_MS,EDIT_MOVE_CANCEL_PX,EDIT_CLICK_SUPPRESS_MS} from "./workspace-edit-standards";

export function useShortcutEditor(ids:string[],change:(ids:string[])=>void,externalEditing=false){
  const [editing,setEditing]=useState(false);
  const [selected,setSelected]=useState(0);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const holding=useRef(false);
  const dragging=useRef<number|null>(null);
  const startPoint=useRef<{x:number;y:number}|null>(null);
  const suppressClick=useRef(false);
  const wasDragged=useRef(false);
  const pointer=useRef<{element:HTMLElement;id:number}|null>(null);
  const idsRef=useRef(ids);
  idsRef.current=ids;
  const changeRef=useRef(change);
  changeRef.current=change;
  const editingRef=useRef(editing);
  editingRef.current=editing||externalEditing;
  const stopTimer=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null}};
  const feedback=()=>{try{if("vibrate" in navigator)navigator.vibrate(10)}catch{}};
  const clearGesture=()=>{holding.current=false;dragging.current=null;startPoint.current=null;pointer.current=null;stopTimer()};
  useEffect(()=>()=>{stopTimer();if(clickTimer.current!==null)clearTimeout(clickTimer.current)},[]);
  const clickTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const armClickSuppression=()=>{suppressClick.current=true;if(clickTimer.current!==null)clearTimeout(clickTimer.current);clickTimer.current=setTimeout(()=>{suppressClick.current=false;clickTimer.current=null},EDIT_CLICK_SUPPRESS_MS)};
  useEffect(()=>{
    if(!externalEditing)return;
    stopTimer();holding.current=false;
    // The parent canvas owns Done; never leave an independent shortcut edit session running.
    setEditing(false);
  },[externalEditing]);
  const handlers=(index:number)=>({
    onPointerDown:(event:React.PointerEvent<HTMLElement>)=>{
      if(event.pointerType==="mouse"&&event.button!==0)return;
      if(editingRef.current)armClickSuppression();
      wasDragged.current=false;
      startPoint.current={x:event.clientX,y:event.clientY};
      pointer.current={element:event.currentTarget,id:event.pointerId};
      if(editingRef.current){
        dragging.current=index;
        try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
      }else{
        holding.current=true;
        stopTimer();
        timer.current=setTimeout(()=>{
          if(!holding.current)return;
          armClickSuppression();
          editingRef.current=true;
          feedback();
          if(!externalEditing)setEditing(true);setSelected(index);
          dragging.current=index;
          try{pointer.current?.element.setPointerCapture(pointer.current.id)}catch{}
        },EDIT_HOLD_MS);
      }
    },
    onPointerMove:(event:React.PointerEvent<HTMLElement>)=>{
      if(!startPoint.current)return;
      const dist=Math.hypot(event.clientX-startPoint.current.x,event.clientY-startPoint.current.y);
      if(!editingRef.current&&dist>EDIT_MOVE_CANCEL_PX){holding.current=false;stopTimer();return}
      if(!editingRef.current||dragging.current===null)return;
      const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-shortcut-index]");
      const to=hit?Number(hit.getAttribute("data-shortcut-index")):-1;
      if(Number.isInteger(to)&&to>=0&&to<idsRef.current.length&&to!==dragging.current){
        wasDragged.current=true;
        changeRef.current(moveNavigationSlot(idsRef.current,dragging.current,to));
        dragging.current=to;setSelected(to);
      }
    },
    onPointerUp:()=>{
      clearGesture();
    },
    onPointerCancel:()=>{
      clearGesture();
    },
    onClick:(event:React.MouseEvent<HTMLElement>)=>{
      if(editingRef.current||suppressClick.current){
        event.preventDefault();
        event.stopPropagation();
        if(!editingRef.current){suppressClick.current=false;if(clickTimer.current!==null){clearTimeout(clickTimer.current);clickTimer.current=null}}
        if(!wasDragged.current)setSelected(index);
        wasDragged.current=false;
      }
    },
    onContextMenu:(event:React.MouseEvent<HTMLElement>)=>{event.preventDefault();if(!externalEditing)setEditing(true);editingRef.current=true;setSelected(index)}
  });
  const done=()=>{setEditing(false);editingRef.current=false;clearGesture();suppressClick.current=false;if(clickTimer.current!==null){clearTimeout(clickTimer.current);clickTimer.current=null}};
  return {editing:editing||externalEditing,setEditing,selected,setSelected,handlers,done};
}
