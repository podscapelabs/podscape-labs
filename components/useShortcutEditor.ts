"use client";
import {useEffect,useRef,useState} from "react";
import {moveNavigationSlot} from "./navigation-customization";

export function useShortcutEditor(ids:string[],change:(ids:string[])=>void){
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
  editingRef.current=editing;
  const stopTimer=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null}};
  useEffect(()=>()=>stopTimer(),[]);
  const handlers=(index:number)=>({
    onPointerDown:(event:React.PointerEvent<HTMLElement>)=>{
      if(event.pointerType==="mouse"&&event.button!==0)return;
      wasDragged.current=false;
      startPoint.current={x:event.clientX,y:event.clientY};
      pointer.current={element:event.currentTarget,id:event.pointerId};
      if(editingRef.current){
        dragging.current=index;suppressClick.current=true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }else{
        holding.current=true;
        stopTimer();
        timer.current=setTimeout(()=>{
          if(!holding.current)return;
          suppressClick.current=true;
          editingRef.current=true;
          setEditing(true);setSelected(index);
          dragging.current=index;
          try{pointer.current?.element.setPointerCapture(pointer.current.id)}catch{}
        },500);
      }
    },
    onPointerMove:(event:React.PointerEvent<HTMLElement>)=>{
      if(!startPoint.current)return;
      const dist=Math.hypot(event.clientX-startPoint.current.x,event.clientY-startPoint.current.y);
      if(!editingRef.current&&dist>10){holding.current=false;stopTimer();return}
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
      holding.current=false;stopTimer();dragging.current=null;startPoint.current=null;pointer.current=null;
    },
    onPointerCancel:()=>{
      holding.current=false;stopTimer();dragging.current=null;startPoint.current=null;
    },
    onClick:(event:React.MouseEvent<HTMLElement>)=>{
      if(editingRef.current||suppressClick.current){
        event.preventDefault();
        event.stopPropagation();
        if(!editingRef.current)suppressClick.current=false;
        if(!wasDragged.current)setSelected(index);
        wasDragged.current=false;
      }
    },
    onContextMenu:(event:React.MouseEvent<HTMLElement>)=>{event.preventDefault();setEditing(true);editingRef.current=true;setSelected(index)}
  });
  const done=()=>{setEditing(false);editingRef.current=false;dragging.current=null;holding.current=false;suppressClick.current=false;pointer.current=null;stopTimer()};
  return {editing,setEditing,selected,setSelected,handlers,done};
}
