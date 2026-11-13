import type {Metadata} from "next";
import Link from "next/link";
import {ThemeToggle} from "@/components/ThemeToggle";
import {MaintenanceMemberAccess} from "@/components/MaintenanceMemberAccess";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {customerSupabase} from "@/lib/customer-auth/server";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import styles from "./pod-access.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Pod Access | PodScape Early Access",
 description:"PodScape is opening in stages. Invited beta testers can sign in or create an account while the public launch is being prepared.",
};

export default async function PodAccessPage(){
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const verifiedEmail=user?.email_confirmed_at?user.email?.trim().toLowerCase():undefined;
 const approved=verifiedEmail?(await testerAccessStatus(verifiedEmail))==="approved":false;
 return <main className={`v2-site ${styles.page}`} id="pod-access">
  <div className={styles.shell}>
   <header className={styles.header}>
    <Link href="/" className={styles.brand} aria-label="PodScape Labs, home">
     <span className={styles.brandMark}><PodscapeLineIcon name="leaf"/></span>
     <span className={styles.brandText}><strong>PodScape</strong><small>LABS / EARLY ACCESS</small></span>
    </Link>
    <div className={styles.headerActions}>
     {approved?<Link className={styles.headerLink} href="/app">Open my PodScape <PodscapeLineIcon name="arrow-right"/></Link>:
      <a className={styles.headerLink} href="#member-access">Member access <PodscapeLineIcon name="arrow-right"/></a>}
     <ThemeToggle/>
    </div>
   </header>

   <div className={styles.content}>
    <section className={styles.hero} aria-labelledby="pod-access-title">
     <div className={styles.heroTop}>
      <span className={styles.status}><span className={styles.statusDot} aria-hidden="true"/> Public launch in preparation</span>
      <span className={styles.heroIndex}>POD / 001</span>
     </div>
     <p className={styles.eyebrow}>YOUR HOBBY. YOUR SPACE.</p>
     <h1 id="pod-access-title">A little world is already open.</h1>
     <p className={styles.heroIntro}>PodScape is opening in stages. While we prepare the public experience, invited explorers can step inside, try features, and help shape what comes next.</p>
     <div className={styles.heroActions}>
      {approved?<Link href="/app" className={styles.primaryAction}>Enter your PodScape <PodscapeLineIcon name="arrow-right"/></Link>:
       <a href="#member-access" className={styles.primaryAction}>Enter Early Access <PodscapeLineIcon name="arrow-right"/></a>}
      <a href="https://podbound.net" target="_blank" rel="noopener noreferrer" className={styles.secondaryAction}>Visit PodBound <PodscapeLineIcon name="arrow-right"/></a>
     </div>
     <div className={styles.heroFoot}><PodscapeLineIcon name="lock"/><span>Public maintenance view · Invitation-only beta access</span></div>
    </section>

    <MaintenanceMemberAccess approved={approved}/>
   </div>

   <section className={styles.explore} aria-labelledby="pod-access-explore">
    <div className={styles.exploreHead}>
     <div><p className={styles.smallEyebrow}>EXPLORE PODSCAPE</p><h2 id="pod-access-explore">Your little corner of the hobby.</h2></div>
     <p>Already part of the beta? This is what awaits beyond Pod Access.</p>
    </div>
    <div className={styles.exploreGrid}>
     <div className={styles.feature}><span><PodscapeLineIcon name="leaf"/></span><div><strong>Explore</strong><p>Discover isopods in the Leaf Ledger.</p></div></div>
     <div className={styles.feature}><span><PodscapeLineIcon name="gamepad"/></span><div><strong>Play</strong><p>Try Fun Zone games and community rankings.</p></div></div>
     <div className={styles.feature}><span><PodscapeLineIcon name="manager"/></span><div><strong>Keep</strong><p>Make colony care your own.</p></div></div>
    </div>
   </section>

   <footer className={styles.footer}>
    <span>PodScape Labs · Made in Canada</span>
    <span>Thanks for helping this little world grow.</span>
   </footer>
  </div>
 </main>;
}
