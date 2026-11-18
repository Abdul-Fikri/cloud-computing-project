"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {taskFields,taskSchema} from "@/lib/validators/task";
import {fieldErrors,readForm} from "@/lib/validators/helpers";
import {getEventReturnPath} from "@/lib/events/return-path";
const empty={message:"",errors:{},values:{}};
export async function saveTask(eventId,taskId,_prev,formData){
 const {group}=await requireGroup(),returnPath=getEventReturnPath(eventId,formData),values=readForm(formData,taskFields),parsed=taskSchema.safeParse(values);
 if(!parsed.success)return {...empty,message:"Periksa kembali data tugas.",errors:fieldErrors(parsed.error),values};
 const pool=getMysqlPool(),[events]=await pool.execute("SELECT id FROM events WHERE id=? AND group_id=? LIMIT 1",[eventId,group.id]);if(!events.length)return {...empty,message:"Event tidak ditemukan.",values};
 if(parsed.data.assigned_to){const [a]=await pool.execute("SELECT id FROM event_members WHERE event_id=? AND group_id=? AND member_id=? LIMIT 1",[eventId,group.id,parsed.data.assigned_to]);if(!a.length)return {...empty,message:"Penanggung jawab harus terdaftar sebagai panitia event ini terlebih dahulu.",values};}
 const d=parsed.data;
 try{if(taskId){const [r]=await pool.execute("UPDATE tasks SET title=?,description=?,assigned_to=?,due_date=?,priority=?,status=?,notes=? WHERE id=? AND event_id=? AND group_id=?",[d.title,d.description||null,d.assigned_to||null,d.due_date||null,d.priority,d.status,d.notes||null,taskId,eventId,group.id]);if(!r.affectedRows)return {...empty,message:"Tugas tidak ditemukan.",values};}
 else await pool.execute("INSERT INTO tasks (id,group_id,event_id,title,description,assigned_to,due_date,priority,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?)",[randomUUID(),group.id,eventId,d.title,d.description||null,d.assigned_to||null,d.due_date||null,d.priority,d.status,d.notes||null]);}
 catch(error){console.error("[saveTask]",error.code,error.message);return {...empty,message:"Tugas gagal disimpan. Periksa kembali datanya.",values};}
 revalidatePath(`/events/${eventId}`);revalidatePath(returnPath);redirect(returnPath);
}
const TASK_STATUSES=new Set(["todo","in_progress","done","blocked"]);
export async function updateTaskStatus(eventId,taskId,status){
 const {group}=await requireGroup();if(!TASK_STATUSES.has(status))return {success:false,message:"Status tugas tidak valid."};
 const [r]=await getMysqlPool().execute("UPDATE tasks SET status=? WHERE id=? AND event_id=? AND group_id=?",[status,taskId,eventId,group.id]);
 if(!r.affectedRows)return {success:false,message:"Status tugas gagal diperbarui."};
 revalidatePath(`/events/${eventId}`);revalidatePath(`/events/${eventId}/tugas/all`);return {success:true,message:"Status tugas diperbarui."};
}
export async function deleteTask(formData){
 const {group}=await requireGroup(),eventId=String(formData.get("event_id")||""),taskId=String(formData.get("task_id")||"");if(!eventId||!taskId)return;
 const returnPath=getEventReturnPath(eventId,formData);await getMysqlPool().execute("DELETE FROM tasks WHERE id=? AND event_id=? AND group_id=?",[taskId,eventId,group.id]);
 revalidatePath(`/events/${eventId}`);revalidatePath(returnPath);redirect(returnPath);
}
