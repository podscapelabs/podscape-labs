import type { Metadata } from "next";
import { PlatformShell } from "@/components/PlatformShell";
import GenusWordSearch from "../GenusWordSearch";
export const metadata:Metadata={title:"Genus Explorer | PodScape Labs",robots:{index:false,follow:false}};
export default function Page(){return <PlatformShell><GenusWordSearch/></PlatformShell>}
