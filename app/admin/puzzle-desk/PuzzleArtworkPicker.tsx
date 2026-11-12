"use client";
import {useEffect,useState} from "react";
import styles from "./puzzle-desk.module.css";

export function PuzzleArtworkPicker(){
 const [image,setImage]=useState<File|null>(null);
 const [url,setUrl]=useState("");
 useEffect(()=>{
  if(!image){setUrl("");return;}
  const next=URL.createObjectURL(image);setUrl(next);
  return ()=>URL.revokeObjectURL(next);
 },[image]);
 return <div className={styles.artworkPicker}>
  <label htmlFor="puzzle-upload" className={styles.artworkLabel}>Puzzle artwork <span>Required</span></label>
  <p className={styles.artworkHelp}>Choose a JPEG, PNG or WebP under 8 MB. Use artwork you own or have permission to publish.</p>
  <div className={styles.artworkPreview}>
   {url?<img src={url} alt="Preview of selected puzzle artwork"/>:<div className={styles.artworkEmpty} aria-hidden="true"><span>✦</span><small>Artwork preview</small></div>}
   <div className={styles.artworkPickerTools}>
    <strong>{image?.name||"Choose an image to build your puzzle"}</strong>
    {image?<small>{(image.size/1024/1024).toFixed(2)} MB · Ready to preview</small>:<small>Artwork is only uploaded when you save the draft.</small>}
    <input id="puzzle-upload" name="image" type="file" accept="image/png,image/jpeg,image/webp" required onChange={event=>setImage(event.target.files?.[0]||null)}/>
   </div>
  </div>
 </div>;
}
