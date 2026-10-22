import type { Metadata } from "next";
import GenusWordSearch from "./GenusWordSearch";
import { Footer } from "@/components/Footer";
export const metadata:Metadata={title:"Genus Explorer | PodScape Labs",robots:{index:false,follow:false}};
export default function Page(){return <div className="v2-site"><GenusWordSearch/><Footer/></div>}