import {Header} from "@/components/Header";
import styles from "@/components/MarketingHome.module.css";
import {MenuPinnedDirectory} from "./MenuPinnedDirectory";
import {isAdminAuthenticated} from "@/lib/admin-auth";

export default async function MenuPage(){
 const isOwner=await isAdminAuthenticated();
 return <div className={`v2-site ${styles.site}`}><Header/><main className={styles.menuPage}>
  <div className="v2-container">
   <h1>Menu</h1>
   <p>Explore PodScape. Pin your favourite destinations for quicker access.</p>
   <MenuPinnedDirectory isOwner={isOwner}/>
  </div>
 </main></div>;
}
