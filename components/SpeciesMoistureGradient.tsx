import styles from "./SpeciesMoistureGradient.module.css";
import {PodscapeLineIcon} from "./PodscapeLineIcon";

export type MoisturePosition = "dry-leaning"|"dry-balanced"|"balanced"|"balanced-moist"|"moist-leaning";
const positions: Record<MoisturePosition,{label:string;index:number}>={
 "dry-leaning":{label:"Dry-leaning",index:0},
 "dry-balanced":{label:"Dry to balanced",index:1},
 "balanced":{label:"Balanced gradient",index:2},
 "balanced-moist":{label:"Balanced to moist",index:3},
 "moist-leaning":{label:"Moist-leaning",index:4}
};
export function SpeciesMoistureGradient({position,note}:{position:MoisturePosition;note?:string}){
 const current=positions[position];
 return <div className={styles.card} aria-label={"General captive moisture tendency: "+current.label}>
   <div className={styles.head}><span>MOISTURE GRADIENT</span><span className={styles.droplet} aria-hidden="true"><PodscapeLineIcon name="droplet" /></span></div>
   <strong className={styles.label}>{current.label}</strong>
   <div className={styles.trackWrap}>
    <div className={styles.bar} aria-hidden="true">
     <span/><span/><span/><span/><span/>
     <i className={styles.indicator} style={{left:`calc(${current.index * 20 + 10}% - 10px)`}}/>
    </div>
    <div className={styles.ends}><span>Drier tendency</span><span>Moister tendency</span></div>
   </div>
   {note?.trim()?<p className={styles.note}>{note.trim()}</p>:<p className={styles.note}>General moisture preference. Localized moist areas may still be important, including for dry-leaning species; consult a species guide for specifics.</p>}
   <p className={styles.caution}>The marker shows a general captive moisture tendency—not humidity %, the amount of wet substrate, or permission to keep an enclosure entirely dry.</p>
  </div>;
}
