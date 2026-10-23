import type {ReactNode} from "react";
import {Header} from "@/components/Header";
import "./OwnerDeskShell.css";

/** Keeps secure owner editors within the familiar PodScape site navigation. */
export function OwnerDeskShell({children}:{children:ReactNode}){
 return <div className="v2-site owner-desk"><a className="skip-link" href="#studio-main">Skip to editor</a><Header/><div id="studio-main">{children}</div></div>;
}
