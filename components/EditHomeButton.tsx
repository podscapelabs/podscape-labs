"use client";
import styles from "./PodscapeHome.module.css";
export function EditHomeButton(){
 return <button type="button" className={styles.editHomeButton} aria-label="Customize your homepage widgets" onClick={()=>window.dispatchEvent(new Event("podscape-edit-home"))}><span aria-hidden="true">✎</span><span>Edit Home</span></button>;
}