import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import LifetimeExpRankings from "./LifetimeExpRankings";
export const metadata:Metadata={title:"Lifetime EXP Rankings | PodScape Labs",robots:{index:false,follow:false}};
export default function Page(){return <PlatformShell><LifetimeExpRankings/></PlatformShell>;}
