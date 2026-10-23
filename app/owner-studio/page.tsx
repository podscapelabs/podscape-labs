import {redirect} from "next/navigation";
import {PlatformShell} from "@/components/PlatformShell";
import {OwnerDashboard} from "@/components/admin/OwnerDashboard";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSpeciesRecords} from "@/lib/species-store";
import {getProductRecords} from "@/lib/product-store";
import {getGuideRecords} from "@/lib/guide-store";
import {getLabRecords} from "@/lib/lab-store";

export const dynamic="force-dynamic";
export default async function OwnerStudioPage(){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const [species,products,guides,lab]=await Promise.all([
  getSpeciesRecords(),getProductRecords(),getGuideRecords(),getLabRecords()
 ]);
 return <PlatformShell><OwnerDashboard species={species} products={products} guides={guides} lab={lab}/></PlatformShell>;
}
