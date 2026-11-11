import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import MarketRankings from "./MarketRankings";
export const metadata:Metadata={title:"Market Rankings | Pod Exchange | PodScape",robots:{index:false,follow:false}};
export default function MarketRankingsPage(){return <PlatformShell><MarketRankings/></PlatformShell>}
