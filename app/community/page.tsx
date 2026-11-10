import type { Metadata } from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {WorkspaceSectionHeader} from "@/components/PodscapeWorkspaceUI";
import { PodscapeLineIcon, type PodscapeIconName } from "@/components/PodscapeLineIcon";
import styles from "./community.module.css";
import { OnlineNow } from "@/components/OnlineNow";

export const metadata:Metadata={
  title:"Community | Podscape Labs",
  description:"Explore the people, projects and shared discoveries that make up the Podscape community.",
  robots:{index:false,follow:false}
};

const upcoming:{icon:PodscapeIconName;label:string;title:string;copy:string}[]=[
  {icon:"vendor",label:"COMING LATER",title:"Vendor Directory",copy:"A dedicated place to discover independent isopod breeders and hobby businesses."},
  {icon:"creative",label:"COMING LATER",title:"Creative Network",copy:"Meet the artists, makers and photographers creating around our little world."},
  {icon:"community",label:"IN THE WORKS",title:"Trading Post",copy:"A community space for proposing isopod swaps, with clear agreements and keeper-to-keeper communication."}
];
const explore:{icon:PodscapeIconName;title:string;copy:string;href:string;cta:string}[]=[
  {icon:"leaf",title:"Explore the Leaf Ledger",copy:"Discover species and learn about the animals behind the hobby.",href:"/ledger",cta:"Browse species"},
  {icon:"book",title:"Learn something new",copy:"Care, setup and husbandry resources for curious keepers.",href:"/field-guide",cta:"Read guides"},
  {icon:"creative",title:"Play together, at your own pace",copy:"Puzzles, quizzes and little challenges in the Fun Zone.",href:"/fun-zone",cta:"Visit Fun Zone"},
  {icon:"note",title:"Follow the studio",copy:"Behind-the-scenes updates and projects taking shape at Podscape Labs.",href:"/from-the-lab",cta:"From the Lab"}
];

const socials:{name:string;copy:string;href:string}[]=[
  {name:"Facebook",copy:"Announcements, species spotlights and community news.",href:"https://www.facebook.com/share/1DpaNVvCJM/"},
  {name:"Instagram",copy:"Isopod photography, creative projects and behind-the-scenes moments.",href:"https://www.instagram.com/podscapelabs/"},
  {name:"TikTok",copy:"Tiny creatures, quick videos and a little Podscape chaos.",href:"https://www.tiktok.com/@podscapelabs"},
  {name:"Discord",copy:"Chat with fellow keepers, share ideas and join the conversation.",href:"https://discord.gg/MRa67kGxz5"}
];

export default function CommunityPage(){
  return <PlatformShell><div className={styles.site}>
    <main className={styles.main} id="community-main">
      
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>PODSCAPE / COMMUNITY</p>
          <h1>Better together,<br/><em>little by little.</em></h1>
          <p>A place for keepers, creators and curious minds to find their people, share discoveries and grow the hobby together.</p>
          <Link href="#explore" className={styles.heroCta}>Explore the community <span aria-hidden="true">↓</span></Link>
        </div>
        <div className={styles.heroMotif} aria-hidden="true">
          <span className={styles.orbitOne}><PodscapeLineIcon name="leaf"/></span>
          <span className={styles.orbitTwo}><PodscapeLineIcon name="community"/></span>
          <span className={styles.orbitThree}><PodscapeLineIcon name="creative"/></span>
          
        </div>
      </header>
      <div className={styles.onlineNow}><OnlineNow/></div>
      <section className={styles.intro} aria-labelledby="community-intro">
        <div><p className={styles.eyebrow}>A COMMUNITY IN THE MAKING</p><h2 id="community-intro">More than a collection.</h2></div>
        <p>Podscape began with a fascination for tiny creatures. The community is where that curiosity extends beyond our own enclosures—from first-time keepers to breeders, artists and people who just love discovering something new.</p>
      </section>
      <section className={styles.section} id="explore" aria-label="Explore PodScape">
        <div className={styles.sectionHeading}><WorkspaceSectionHeader title="Find your corner of PodScape" description="Explore the experiences that are available now." meta="Open now"/></div>
        <div className={styles.exploreGrid}>{explore.map(item=><Link className={styles.exploreCard} href={item.href} key={item.href}>
          <span className={styles.exploreIcon}><PodscapeLineIcon name={item.icon}/></span>
          <strong>{item.title}</strong><p>{item.copy}</p><span className={styles.cardLink}>{item.cta} <span aria-hidden="true">↗</span></span>
        </Link>)}</div>
      </section>
      <section className={styles.section} aria-label="PodScape social channels">
        <div className={styles.sectionHeading}><WorkspaceSectionHeader title="Find PodScape beyond the portal" description="Follow along and join the conversation."/></div>
        <p className={styles.sectionDescription}>Follow along, say hello and join the little world we&apos;re growing together.</p>
        <div className={styles.exploreGrid}>{socials.map(item=><a className={styles.exploreCard} href={item.href} target="_blank" rel="noopener noreferrer" key={item.name}>
          <span className={styles.exploreIcon} aria-hidden="true"><PodscapeLineIcon name="community"/></span>
          <strong>{item.name}</strong><p>{item.copy}</p><span className={styles.cardLink}>Visit {item.name} <span aria-hidden="true">↗</span></span>
        </a>)}</div>
      </section>
      <section className={styles.section} aria-label="Future community spaces">
        <div className={styles.sectionHeading}><WorkspaceSectionHeader title="Room for everyone" description="Future spaces for keepers, vendors, and creators."/></div>
        <p className={styles.sectionDescription}>These are the spaces we want to grow into. They aren&apos;t open yet, but this is where they&apos;ll live as we build them.</p>
        <div className={styles.futureGrid}>{upcoming.map(item=><article className={styles.futureCard} key={item.title}>
          <span className={styles.futureIcon}><PodscapeLineIcon name={item.icon}/></span>
          <div><small>{item.label}</small><h3>{item.title}</h3><p>{item.copy}</p></div>
        </article>)}</div>
      </section>
      <section className={styles.close}><span aria-hidden="true"><PodscapeLineIcon name="community" /></span><div><p className={styles.eyebrow}>THE LITTLE WORLD WE SHARE</p><h2>Every keeper starts somewhere.</h2><p>There&apos;s always something new to learn, create or discover. We&apos;re building a place where all of it belongs.</p></div><Link href="/app">Back to Podscape <span aria-hidden="true">→</span></Link></section>
    </main>
  </div></PlatformShell>;
}
