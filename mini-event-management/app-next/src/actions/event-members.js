"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireGroup } from "@/lib/auth";
import { getMysqlPool } from "@/lib/mysql";
import { fieldErrors, readForm } from "@/lib/validators/helpers";
import { getEventReturnPath } from "@/lib/events/return-path";
const schema=z.object({member_id:z.string().uuid("Pilih anggota yang valid."),division_id:z.union([z.string().uuid("Pilih divisi yang valid."),z.literal("")]).transform(v=>v||null),position_title:z.string().trim().max(80).transform(v=>v||null),responsibility:z.string().trim().max(500).transform(v=>v||null)});
const fields=["member_id","division_id","position_title","responsibility"],empty={message:"",errors:{},values:{}};
export async function saveEventMember(eventId,assignmentId,_prev,formData){
 const {group}=await requireGroup(),returnPath=getEventReturnPath(eventId,formData),values=readForm(formData,fields),parsed=schema.safeParse(values);
 if(!parsed.success)return {...empty,message:"Periksa kembali isian susunan panitia.",errors:fieldErrors(parsed.error),values};
 const pool=getMysqlPool();
 const [[eventRows],[memberRows]] = await Promise.all([
  pool.execute("SELECT id FROM events WHERE id=? AND group_id=? LIMIT 1",[eventId,group.id]),
  pool.execute("SELECT id FROM members WHERE id=? AND group_id=? LIMIT 1",[parsed.data.member_id,group.id])
 ]);
 if(!eventRows.length)return {...empty,message:"Event tidak ditemukan.",values};
 if(!memberRows.length)return {...empty,message:"Anggota tidak ditemukan pada grup ini.",values};
 let division=null;
 if(parsed.data.division_id){const [rows]=await pool.execute("SELECT id,name FROM event_divisions WHERE id=? AND event_id=? AND group_id=? LIMIT 1",[parsed.data.division_id,eventId,group.id]);division=rows[0];if(!division)return {...empty,message:"Divisi tidak ditemukan pada event ini.",errors:{division_id:"Pilih divisi yang tersedia untuk event ini."},values};}
 let divisionLabel=division?.name??null;
 if(!divisionLabel&&assignmentId){const [rows]=await pool.execute("SELECT division,division_id FROM event_members WHERE id=? AND event_id=? AND group_id=? LIMIT 1",[assignmentId,eventId,group.id]);if(rows[0]&&!rows[0].division_id)divisionLabel=rows[0].division;}
 try {if(assignmentId){const [r]=await pool.execute("UPDATE event_members SET member_id=?,division_id=?,division=?,position_title=?,responsibility=? WHERE id=? AND event_id=? AND group_id=?",[parsed.data.member_id,division?.id??null,divisionLabel,parsed.data.position_title,parsed.data.responsibility,assignmentId,eventId,group.id]);if(!r.affectedRows)return {...empty,message:"Penugasan tidak ditemukan.",values};}
 else await pool.execute("INSERT INTO event_members (id,group_id,event_id,member_id,division_id,division,position_title,responsibility) VALUES (?,?,?,?,?,?,?,?)",[randomUUID(),group.id,eventId,parsed.data.member_id,division?.id??null,divisionLabel,parsed.data.position_title,parsed.data.responsibility]);}
 catch(error){console.error("[saveEventMember]",error.code,error.message);return {...empty,message:error.code==="ER_DUP_ENTRY"?"Anggota ini sudah terdaftar dalam susunan panitia event.":"Susunan panitia gagal disimpan.",values};}
 for(const p of [`/events/${eventId}`,returnPath,"/panitia",`/panitia/events/${eventId}`])revalidatePath(p);redirect(returnPath);
}
export async function deleteEventMember(formData){
 const {group}=await requireGroup(),eventId=String(formData.get("event_id")||""),assignmentId=String(formData.get("assignment_id")||"");if(!eventId||!assignmentId)return;
 const returnPath=getEventReturnPath(eventId,formData);await getMysqlPool().execute("DELETE FROM event_members WHERE id=? AND event_id=? AND group_id=?",[assignmentId,eventId,group.id]);
 for(const p of [`/events/${eventId}`,returnPath,"/panitia",`/panitia/events/${eventId}`])revalidatePath(p);redirect(returnPath);
}
