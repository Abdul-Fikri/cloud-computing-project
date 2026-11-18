import {NextResponse} from "next/server";
import {getMysqlPool} from "@/lib/mysql";
import {getSessionUser} from "@/lib/mysql-auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(_request,{params}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new Response("Not found",{status:404});

 const user=await getSessionUser();
 if(!user)return new Response("Unauthorized",{status:401});

 const [access]=await getMysqlPool().execute(
  "SELECT g.id FROM `groups` g LEFT JOIN members m ON m.group_id=g.id AND m.auth_user_id=? WHERE g.id=? AND (g.owner_id=? OR m.auth_user_id=?) LIMIT 1",
  [user.id,id,user.id,user.id]
 );
 if(!access.length)return new Response("Not found",{status:404});

 const [rows]=await getMysqlPool().execute("SELECT logo_mime,logo_data FROM `groups` WHERE id=? LIMIT 1",[id]);
 const row=rows[0];
 if(!row?.logo_data||!row.logo_mime)return new Response(null,{status:404});
 return new NextResponse(row.logo_data,{headers:{
  "Content-Type":row.logo_mime,
  "Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff"
 }});
}
