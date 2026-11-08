import { notFound, redirect } from "next/navigation";
import { getEnclosure } from "@/lib/keeper";
export const dynamic="force-dynamic";
/** One primary enclosure workspace, whether opened from Manager or an existing QR label. */
export default async function EnclosurePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const data=await getEnclosure(id);
 if(!data)notFound();
 if(data.enclosure.isArchived)redirect("/keeper/"+id+"/details");
 redirect("/keeper/scan?bin="+encodeURIComponent(id));
}
