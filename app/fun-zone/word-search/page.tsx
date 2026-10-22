import type { Metadata } from "next";
import GenusWordSearch from "./GenusWordSearch";
export const metadata:Metadata={title:"Genus Explorer | PodScape Labs",robots:{index:false,follow:false}};
export default function Page(){return <GenusWordSearch/>}