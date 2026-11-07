import Link from "next/link";
import { Header } from "@/components/Header";
import styles from "@/components/MarketingHome.module.css";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import { navigationChoices, navigationGroups } from "@/components/navigation-customization";

export default function MenuPage(){
 return <div className={`v2-site ${styles.site}`}><Header/><main className={styles.menuPage}>
  <div className="v2-container">
   <h1>Menu</h1>
   <p>Explore everything Podscape has to offer. Make your favorite destinations part of your home by pressing and holding a shortcut.</p>
   {navigationGroups.map(group=>{
    const choices=navigationChoices.filter(item=>item.group===group&&item.id!=="menu");
    if(!choices.length)return null;
    return <section key={group} className={styles.menuGroup} aria-label={group}>
     <h2>{group}</h2>
     <nav className={styles.menuList} aria-label={group+" destinations"}>
      {choices.map(item=><Link href={item.href} key={item.id}>
       <i><PodscapeLineIcon name={item.icon}/></i>
       <span><strong>{item.label}{item.planned?<em className={styles.menuPlanned}>Planned</em>:null}</strong><small>{item.description}</small></span>
       <b aria-hidden="true">›</b>
      </Link>)}
     </nav>
    </section>;
   })}
  </div>
 </main></div>;
}
