"use client";

import {useState} from "react";
import Link from "next/link";
import {CustomerAccountForm} from "./CustomerAccountForm";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./MaintenanceMemberAccess.module.css";

export function MaintenanceMemberAccess({approved=false}:{approved?:boolean}){
 const [mode,setMode]=useState<"login"|"sign-up">("login");
 return <section className={styles.section} id="member-access" aria-labelledby="member-access-title">
  <div className={styles.heading}>
   <div><p className={styles.eyebrow}>POD ACCESS / INVITED EXPLORERS</p>
    <h2 id="member-access-title">Your way into PodScape.</h2>
    <p>Already invited? Welcome in. New beta testers can create an account with their approved email.</p></div>
   <span className={styles.headingIcon}><PodscapeLineIcon name="lock"/></span>
  </div>
  {approved?<div className={styles.signedIn}>
    <div><strong>Your access is ready.</strong><p>You are signed in with an approved PodScape account.</p></div>
    <Link href="/app">Open my PodScape <PodscapeLineIcon name="arrow-right"/></Link>
   </div>:
   <>
    <div className={styles.tabs} role="group" aria-label="Choose beta account access">
     <button type="button" className={mode==="login"?styles.selected:undefined} aria-pressed={mode==="login"} onClick={()=>setMode("login")}>Sign in</button>
     <button type="button" className={mode==="sign-up"?styles.selected:undefined} aria-pressed={mode==="sign-up"} onClick={()=>setMode("sign-up")}>Create account</button>
    </div>
    <div className={styles.form}>
     <p className={styles.formIntro}>{mode==="login"?"Use your PodScape email and password to continue.":"Use the email address you gave us for beta access. Verify your email before signing in."}</p>
     <CustomerAccountForm key={mode} kind={mode} embedded/>
    </div>
    <p className={styles.accessNote}><PodscapeLineIcon name="check"/> Approved emails only · Verification required · Owner Studio stays private</p>
   </>
  }
 </section>;
}
