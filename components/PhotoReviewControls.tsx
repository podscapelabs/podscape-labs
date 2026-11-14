"use client";
import {useState,useTransition} from "react";
import {reviewMemberPhoto} from "@/app/admin/photo-contributions/actions";
export function PhotoReviewControls({id}:{id:string}){
 const [pending,startTransition]=useTransition();
 const [message,setMessage]=useState("");
 function act(choice:"approved"|"rejected"){
  startTransition(async()=>{
   const form=new FormData();form.set("id",id);form.set("choice",choice);
   const result=await reviewMemberPhoto(form);
   if(!result.success)setMessage(result.error||"Review failed.");
  });
 }
 return <div style={{display:"grid",gap:8}}>
  <div style={{display:"flex",gap:8}}>
   <button disabled={pending} type="button" onClick={()=>act("approved")}>Approve</button>
   <button disabled={pending} type="button" onClick={()=>act("rejected")}>Reject</button>
  </div>
  {message?<small role="alert">{message}</small>:null}
 </div>;
}
