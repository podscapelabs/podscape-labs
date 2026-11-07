"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { preparePodBoundArtworkUpload, savePodBoundCard } from "./actions";

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";

export function CardEditorForm({cardId,children,className}:{cardId:string;children:ReactNode;className:string}){
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState("");

  async function onSubmit(event:FormEvent<HTMLFormElement>){
    const form=event.currentTarget;
    const core=form.querySelector<HTMLInputElement>('input[data-card-art="core"]');
    const alternate=form.querySelector<HTMLInputElement>('input[data-card-art="alternate"]');
    const queue=([["core",core],["alternate",alternate]] as const).filter(([,input])=>Boolean(input?.files?.length));
    if(!queue.length)return;
    event.preventDefault();
    if(uploading)return;
    setError("");
    setUploading(true);
    try{
      if(!SUPABASE_URL||!SUPABASE_KEY)throw new Error("Artwork upload is not configured. Please contact the site owner.");
      const storage=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{autoRefreshToken:false,persistSession:false}}).storage.from("podbound-art");
      for(const [kind,input] of queue){
        const file=input!.files![0];
        if(file.size>10*1024*1024)throw new Error("Artwork must be 10 MB or smaller.");
        const prepared=await preparePodBoundArtworkUpload(cardId,kind,file.type,file.size);
        if(prepared.error||!prepared.path||!prepared.token)throw new Error(prepared.error||"Unable to prepare artwork upload.");
        const {error:uploadError}=await storage.uploadToSignedUrl(prepared.path,prepared.token,file,{contentType:file.type});
        if(uploadError)throw new Error("Artwork upload failed: "+uploadError.message);
        const hidden=form.elements.namedItem(kind==="core"?"uploaded_core_path":"uploaded_alternate_path") as HTMLInputElement|null;
        if(!hidden)throw new Error("Unable to attach the uploaded artwork.");
        hidden.value=prepared.path;
        input!.value="";
      }
      setUploading(false);
      // The next submit contains only text fields and storage paths, not image bytes.
      form.requestSubmit();
    }catch(err){
      setError(err instanceof Error?err.message:"Unable to upload artwork. Please try again.");
      setUploading(false);
    }
  }

  return <>
    {error&&<p role="alert" style={{padding:"12px 16px",border:"1px solid #b85c51",borderRadius:12,color:"#b85c51",marginBottom:14}}>{error}</p>}
    {uploading&&<p role="status" style={{padding:"12px 16px",border:"1px solid var(--line)",borderRadius:12,color:"var(--forest)",marginBottom:14}}>Uploading artwork securely… Please keep this page open.</p>}
    <form id="card-editor" action={savePodBoundCard} className={className} onSubmit={onSubmit} aria-busy={uploading}>
      <input type="hidden" name="uploaded_core_path" defaultValue=""/>
      <input type="hidden" name="uploaded_alternate_path" defaultValue=""/>
      {children}
    </form>
  </>;
}
