import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import {PodExchange} from "./PodExchange";
export const metadata:Metadata={title:"The Pod Exchange | Fun Zone | PodScape",description:"Trade fictional isopod companies with Duck Bucks in a silly little market simulator.",robots:{index:false,follow:false}};
export default function PodExchangePage(){
 return <PlatformShell><PodExchange/></PlatformShell>;
}
