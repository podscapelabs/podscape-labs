import {Header} from "@/components/Header";
import styles from "@/components/MarketingHome.module.css";
import {MenuPinnedDirectory} from "./MenuPinnedDirectory";

export default function MenuPage(){
 return <div className={`v2-site ${styles.site}`}><Header/><main className={styles.menuPage}>
  <div className="v2-container">
   <h1>Menu</h1>
   <p>Explore PodScape. Pin the destinations you visit most to keep them at the top of your Menu.</p>
   <MenuPinnedDirectory/>
  </div>
 </main></div>;
}
