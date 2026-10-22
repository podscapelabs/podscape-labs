import { NextResponse } from "next/server";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
 const db = await customerSupabase();
 if (!db) return NextResponse.json({error:"Not signed in"},{status:401});
 const {data:{user}} = await db.auth.getUser();
 if (!user) return NextResponse.json({error:"Not signed in"},{status:401});
 let body: unknown;
 try { body = await request.json(); } catch { return NextResponse.json({error:"Invalid request"},{status:400}); }
 const speciesId = typeof body === "object" && body !== null && "speciesId" in body ? (body as {speciesId:unknown}).speciesId : null;
 if (typeof speciesId !== "string" || speciesId.length > 120 || !/^[a-zA-Z0-9_-]+$/.test(speciesId)) return NextResponse.json({error:"Invalid species"},{status:400});
 const admin = getSupabaseAdmin();
 if (!admin) return NextResponse.json({error:"Progress unavailable"},{status:503});
 const {data,error} = await admin.rpc("record_species_discovery",{p_user_id:user.id,p_species_id:speciesId});
 if (error) { console.error("Species discovery failed",error.code); return NextResponse.json({error:"Unable to record discovery"},{status:500}); }
 const result = Array.isArray(data) ? data[0] : data;
 return NextResponse.json({viewCount:result?.view_count ?? 0,unlocked:result?.achievement_unlocked ?? false});
}
