import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import {PsxV3Preview} from "./PsxV3Preview";
export const metadata:Metadata={title:"PSX 2.0 Owner Preview | PodScape",robots:{index:false,follow:false}};
export default function Page(){return <PlatformShell><PsxV3Preview/></PlatformShell>}
