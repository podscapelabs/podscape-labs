"use client";
import {useEffect,useRef,useState} from "react";
import type {GalleryPhoto} from "@/lib/member-photo-gallery";
import styles from "./MemberPhotoGallery.module.css";

type SpeciesOption={id:string;name:string};
export function MemberPhotoGallery({species,initialPhotos=[],signedIn=true,launchSignal=0,compact=false,enclosureId,launcherOnly=false}:{
 species:SpeciesOption[];initialPhotos?:GalleryPhoto[];signedIn?:boolean;launchSignal?:number;compact?:boolean;enclosureId?:string;launcherOnly?:boolean;
}){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(species[0]?.id||"");
 const [speciesSearch,setSpeciesSearch]=useState("");
 const [file,setFile]=useState<File|null>(null),[contribute,setContribute]=useState(false),[credit,setCredit]=useState<"username"|"anonymous">("username");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[photos,setPhotos]=useState(initialPhotos);
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(launchSignal>0)setOpen(true)},[launchSignal]);
 useEffect(()=>{setPhotos(initialPhotos)},[initialPhotos]);
 const matchedSpecies=speciesSearch.trim()?species.filter(item=>item.name.toLowerCase().includes(speciesSearch.trim().toLowerCase())):species;
 async function optimize(source:File):Promise<File>{
   // Decode on iOS Safari as well as desktop; some Safari versions lack createImageBitmap for uploads.
   let bitmap:ImageBitmap|null=null,photo:HTMLImageElement|null=null,objectUrl="";
   try{
     if(typeof createImageBitmap==="function"){
       try{bitmap=await createImageBitmap(source);}catch{}
     }
     if(!bitmap){
       objectUrl=URL.createObjectURL(source);
       photo=await new Promise<HTMLImageElement>((resolve,reject)=>{
         const img=new Image();
         img.onload=()=>resolve(img);
         img.onerror=()=>reject(new Error("This photo format could not be opened. Please choose a JPEG or PNG."));
         img.src=objectUrl;
       });
     }
     const width=bitmap?.width||photo?.naturalWidth||0,height=bitmap?.height||photo?.naturalHeight||0;
     if(!width||!height)throw new Error("Could not read this photo.");
     const factor=Math.min(1,1920/Math.max(width,height));
     const canvas=document.createElement("canvas");
     canvas.width=Math.max(1,Math.round(width*factor));
     canvas.height=Math.max(1,Math.round(height*factor));
     const ctx=canvas.getContext("2d");
     if(!ctx)throw new Error("This browser cannot process photos.");
     ctx.drawImage(bitmap||photo!,0,0,canvas.width,canvas.height);
     const encode=(type:string,quality:number)=>new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,type,quality));
     let blob=await encode("image/webp",.78);
     if(!blob||blob.type!=="image/webp")blob=await encode("image/jpeg",.78);
     if(!blob||(blob.type!=="image/webp"&&blob.type!=="image/jpeg"))throw new Error("Could not prepare this photo. Try a JPEG image.");
     const ext=blob.type==="image/webp"?"webp":"jpg";
     return new File([blob],"species-photo."+ext,{type:blob.type});
   }finally{
     bitmap?.close();
     if(objectUrl)URL.revokeObjectURL(objectUrl);
   }
 }
 async function save(event:React.FormEvent<HTMLFormElement>){
   event.preventDefault();if(!file||!selected||busy)return;
   setBusy(true);setMessage("");
   try{
     if(file.size>15*1024*1024)throw new Error("Choose a source image under 15 MB.");
     if(species.length>1&&speciesSearch.trim()&&!matchedSpecies.some(item=>item.id===selected))throw new Error("Choose a matching species first.");
     const processed=await optimize(file);
     if(processed.size>5*1024*1024)throw new Error("The optimized photo is too large.");
     const data=new FormData();
     data.set("speciesId",selected);data.set("file",processed);data.set("contribute",String(contribute));data.set("creditType",credit);
     if(enclosureId)data.set("enclosureId",enclosureId);
     const response=await fetch("/api/member-photos",{method:"POST",body:data});
     const result=await response.json();
     if(!response.ok)throw new Error(result.error||"Upload failed.");
     setMessage(contribute?"Photo saved and submitted for owner review.":"Photo saved privately.");
     setFile(null);setContribute(false);if(input.current)input.current.value="";
     if(species.length===1)window.location.reload();
   }catch(error){setMessage(error instanceof Error?error.message:"Could not upload photo.");}
   finally{setBusy(false);}
 }
 async function remove(id:string){
   if(!window.confirm("Delete this photo? An approved contribution will also disappear from the public gallery."))return;
   const response=await fetch("/api/member-photos",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
   if(response.ok)setPhotos(items=>items.filter(item=>item.id!==id));else setMessage("Unable to remove photo.");
 }
 return <section className={launcherOnly?styles.launcher:styles.card} aria-label="Species photo gallery">
  {!launcherOnly?<><div className={styles.heading}><div><strong>{compact?"Add a species photo":"Species photos"}</strong><small>Personal collection · Approved community contributions</small></div>
   <button type="button" onClick={()=>signedIn?setOpen(true):window.location.assign("/account/login")}>+ Add Photo</button></div>
  {!compact&&photos.length?<div className={styles.gallery}>{photos.map(photo=><figure key={photo.id}><a href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt="Keeper-submitted species photograph" loading="lazy"/></a><figcaption>{photo.mine?photo.status==="approved"?"Approved contribution":photo.status==="pending"?"Pending review":photo.status==="rejected"?"Not approved":"Private photo":"Photo by "+photo.credit}</figcaption>{photo.mine?<button type="button" onClick={()=>remove(photo.id)}>Remove</button>:null}</figure>)}</div>:!compact?<p>No community photos yet. Be the first to contribute!</p>:null}</> : null}
  {open?<div className={styles.backdrop} onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)setOpen(false)}}><div role="dialog" aria-modal="true" aria-label="Add species photo" className={styles.modal}>
   <div className={styles.heading}><strong>Add species photo</strong><button type="button" onClick={()=>setOpen(false)} disabled={busy} aria-label="Close">×</button></div>
   <form onSubmit={save}>
    {species.length>1?<div className={styles.speciesPicker}><label htmlFor="member-photo-species-search">Search species<input id="member-photo-species-search" type="search" value={speciesSearch} onChange={event=>setSpeciesSearch(event.target.value)} placeholder="Search species or morph…" autoComplete="off"/></label><label>Species<select required value={matchedSpecies.some(item=>item.id===selected)?selected:""} onChange={event=>{setSelected(event.target.value);setSpeciesSearch("");}}><option value="" disabled>{matchedSpecies.length?"Select species…":"No matching species"}</option>{matchedSpecies.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>:<p>{species[0]?.name}</p>}
    <label>Choose a photo<input ref={input} required type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={event=>setFile(event.target.files?.[0]||null)}/></label>
    <small>Optimized locally before upload as WebP or JPEG. Up to 15 MB source; maximum 5 MB stored. Camera metadata removed.</small>
    <label className={styles.checkbox}><input type="checkbox" checked={contribute} onChange={event=>setContribute(event.target.checked)}/> Submit to the public Leaf Ledger for approval</label>
    {contribute?<><p>By submitting, I confirm this is my photograph and permit PodScape to display it with credit. I retain copyright and may withdraw the photo.</p>
    <label>Photo credit<select value={credit} onChange={event=>setCredit(event.target.value as "username"|"anonymous")}><option value="username">My PodScape display name</option><option value="anonymous">Anonymous keeper</option></select></label></>:null}
    {message?<p role="status">{message}</p>:null}
    <div className={styles.actions}><button type="button" disabled={busy} onClick={()=>setOpen(false)}>Close</button><button type="submit" disabled={!file||busy}>{busy?"Saving…":"Save photo"}</button></div>
   </form>
  </div></div>:null}
 </section>;
}
