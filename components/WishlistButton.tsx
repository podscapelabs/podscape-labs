"use client";
import { useEffect,useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSpeciesWished } from "@/app/ledger/collection/wishlist-actions";
import styles from "./CollectionControls.module.css";
export function WishlistButton({speciesId,speciesName,initialWished}:{speciesId:string;speciesName:string;initialWished:boolean}){
 const [wished,setWished]=useState(initialWished);
 const [error,setError]=useState("");
 const [pending,startTransition]=useTransition();
 const router=useRouter();
 useEffect(()=>setWished(initialWished),[initialWished]);
 const title=wished?`Remove ${speciesName} from wishlist`:`Add ${speciesName} to wishlist`;
 return <div className={styles.wishControl}><button type="button" className={styles.wishToggle} data-wished={wished} aria-pressed={wished} aria-label={title} title={title} disabled={pending} onClick={()=>{setError("");startTransition(async()=>{try{const result=await setSpeciesWished(speciesId,!wished);if(result.success){setWished(!wished);router.refresh()}else setError(result.error||"Wishlist update failed.")}catch{setError("Wishlist update failed.")}})}}><svg width="22" height="22" viewBox="0 0 24 24" fill={wished?"currentColor":"none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/></svg></button>{error?<p role="alert" className={styles.wishError}>{error}</p>:null}</div>;
}
