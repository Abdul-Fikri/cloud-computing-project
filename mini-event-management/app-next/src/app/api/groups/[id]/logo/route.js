import {NextResponse} from "next/server";
import {getMysqlPool} from "@/lib/mysql";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request,{params}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new Response("Not found",{status:404});
 const [rows]=await getMysqlPool().execute("SELECT logo_mime,logo_data FROM `groups` WHERE id=? LIMIT 1",[id]);
 const row=rows[0];if(!row?.logo_data||!row.logo_mime)return new Response(null,{status:404});
 return new NextResponse(row.logo_data,{headers:{"Content-Type":row.logo_mime,"Cache-Control":"public, max-age=3600, stale-while-revalidate=86400","X-Content-Type-Options":"nosniff"}});
}
