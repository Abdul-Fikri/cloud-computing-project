import {NextResponse} from "next/server";
import {getCurrentOwner,getOwnerGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const owner=await getCurrentOwner();if(!owner)return NextResponse.json({error:"Unauthorized"},{status:401});
  const group=await getOwnerGroup();if(!group)return NextResponse.json({error:"Group not found"},{status:404});
  const [events]=await getMysqlPool().execute("SELECT id,name,description,start_date,end_date,location,status,status_mode,created_at,updated_at FROM events WHERE group_id=? ORDER BY start_date ASC,id ASC",[group.id]);
  return NextResponse.json({events});
 }catch(error){console.error("Failed to fetch events from MySQL:",error);return NextResponse.json({error:"Gagal mengambil data event."},{status:500});}
}
