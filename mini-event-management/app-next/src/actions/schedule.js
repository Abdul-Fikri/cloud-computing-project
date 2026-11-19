"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {scheduleFields,scheduleSchema} from "@/lib/validators/schedule";
import {fieldErrors,readForm} from "@/lib/validators/helpers";
import {getEventReturnPath} from "@/lib/events/return-path";
const empty={message:"",errors:{},values:{}};
export async function saveScheduleItem(eventId,itemId,_prev,formData){
 const {group}=await requireGroup(),returnPath=getEventReturnPath(eventId,formData),values=readForm(formData,scheduleFields),parsed=scheduleSchema.safeParse(values);
 if(!parsed.success)return {...empty,message:"Periksa kembali data rundown.",errors:fieldErrors(parsed.error),values};
 const pool=getMysqlPool(),[events]=await pool.execute("SELECT id,start_date,end_date FROM events WHERE id=? AND group_id=? LIMIT 1",[eventId,group.id]),event=events[0];
 if(!event)return {...empty,message:"Event tidak ditemukan.",values};
 if(parsed.data.item_date<event.start_date||(event.end_date&&parsed.data.item_date>event.end_date))return {...empty,message:"Tanggal kegiatan harus berada dalam rentang tanggal event.",values};
 if(parsed.data.pic_member_id){const [a]=await pool.execute("SELECT id FROM event_members WHERE event_id=? AND group_id=? AND member_id=? LIMIT 1",[eventId,group.id,parsed.data.pic_member_id]);if(!a.length)return {...empty,message:"PIC harus terdaftar sebagai panitia event ini terlebih dahulu.",values};}
 let sortOrder=0;
 if(!itemId){const [rows]=await pool.execute("SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM schedule_items WHERE event_id=? AND group_id=?",[eventId,group.id]);sortOrder=rows[0].next_order;}
 const d=parsed.data;
 try{if(itemId){const [r]=await pool.execute("UPDATE schedule_items SET title=?,item_date=?,start_time=?,end_time=?,location=?,pic_member_id=?,notes=? WHERE id=? AND event_id=? AND group_id=?",[d.title,d.item_date,d.start_time||null,d.end_time||null,d.location||null,d.pic_member_id||null,d.notes||null,itemId,eventId,group.id]);if(!r.affectedRows)return {...empty,message:"Kegiatan rundown tidak ditemukan.",values};}
 else await pool.execute("INSERT INTO schedule_items (id,group_id,event_id,title,item_date,start_time,end_time,location,pic_member_id,notes,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)",[randomUUID(),group.id,eventId,d.title,d.item_date,d.start_time||null,d.end_time||null,d.location||null,d.pic_member_id||null,d.notes||null,sortOrder]);}
 catch(error){console.error("[saveScheduleItem]",error.code,error.message);return {...empty,message:"Kegiatan rundown gagal disimpan. Coba periksa kembali datanya.",values};}
 revalidatePath(`/events/${eventId}`);revalidatePath(returnPath);redirect(returnPath);
}
export async function deleteScheduleItem(formData){
 const {group}=await requireGroup(),eventId=String(formData.get("event_id")||""),itemId=String(formData.get("item_id")||"");if(!eventId||!itemId)return;
 const returnPath=getEventReturnPath(eventId,formData);await getMysqlPool().execute("DELETE FROM schedule_items WHERE id=? AND event_id=? AND group_id=?",[itemId,eventId,group.id]);
 revalidatePath(`/events/${eventId}`);revalidatePath(returnPath);redirect(returnPath);
}
