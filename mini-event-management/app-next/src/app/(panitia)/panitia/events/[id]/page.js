import Link from "next/link";
import {notFound} from "next/navigation";
import {requirePanitia} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {EVENT_STATUS_LABELS,getEffectiveEventStatus} from "@/lib/events/status";
export const metadata={title:"Detail Event Panitia"};
const procurementStatusLabel={not_started:"Belum dimulai",requested:"Diminta",ordered:"Dipesan",purchased:"Sudah dibeli",ready:"Siap digunakan",not_needed:"Tidak diperlukan"};
export default async function PanitiaEventPage({params}){
 const {id}=await params,{member}=await requirePanitia(),pool=getMysqlPool();
 const [[assignments],[events]] = await Promise.all([
  pool.execute("SELECT division,position_title,responsibility FROM event_members WHERE event_id=? AND member_id=? LIMIT 1",[id,member.id]),
  pool.execute("SELECT id,name,description,start_date,end_date,location,status,status_mode,planning_start_date,preparation_start_date,evaluation_end_date FROM events WHERE id=? LIMIT 1",[id])
 ]);
 const assignment=assignments[0],event=events[0];if(!assignment||!event)notFound();
 const [[schedule],[tasks],[procurement]]=await Promise.all([
  pool.execute("SELECT id,title,item_date,start_time,end_time,location,notes FROM schedule_items WHERE event_id=? ORDER BY item_date,start_time",[id]),
  pool.execute("SELECT id,title,due_date,status,priority,description FROM tasks WHERE event_id=? ORDER BY due_date",[id]),
  pool.execute("SELECT id,name,quantity,unit,status FROM procurement_items WHERE event_id=? ORDER BY created_at",[id])
 ]);
 const effectiveStatus=getEffectiveEventStatus(event);
 return <div className="space-y-5"><Link href="/panitia" className="text-sm text-indigo-700">← Event yang ditugaskan</Link><section className="rounded-lg border border-zinc-200 bg-white p-5"><p className="text-xs uppercase tracking-wide text-zinc-500">Ruang kerja event</p><h1 className="mt-1 text-2xl font-semibold">{event.name}</h1><p className="mt-1 text-sm font-medium">{EVENT_STATUS_LABELS[effectiveStatus]}</p><p className="mt-2 text-sm text-zinc-600">{event.start_date}{event.end_date?" – "+event.end_date:""} · {event.location||"Lokasi belum ditentukan"}</p><p className="mt-3 text-sm font-medium">{assignment.division||"Panitia"}{assignment.position_title?" · "+assignment.position_title:""}</p>{assignment.responsibility?<p className="mt-1 text-sm text-zinc-600">{assignment.responsibility}</p>:null}</section><section className="rounded-lg border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Rundown</h2>{schedule.length?<ul className="mt-3 divide-y divide-zinc-100">{schedule.map(item=><li key={item.id} className="py-3"><p className="font-medium">{item.title}</p><p className="text-xs text-zinc-500">{item.item_date} · {item.start_time||"Waktu belum diatur"}{item.end_time?" – "+item.end_time:""} · {item.location||"Lokasi belum ditentukan"}</p>{item.notes?<p className="mt-1 text-sm text-zinc-600">{item.notes}</p>:null}</li>)}</ul>:<p className="mt-2 text-sm text-zinc-500">Belum ada item rundown.</p>}</section><section className="rounded-lg border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Tugas</h2>{tasks.length?<ul className="mt-3 divide-y divide-zinc-100">{tasks.map(task=><li key={task.id} className="py-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{task.title}</p><span className="text-xs text-zinc-500">{task.status} · {task.priority}</span></div>{task.due_date?<p className="text-xs text-zinc-500">Deadline: {task.due_date}</p>:null}{task.description?<p className="mt-1 text-sm text-zinc-600">{task.description}</p>:null}</li>)}</ul>:<p className="mt-2 text-sm text-zinc-500">Belum ada tugas.</p>}</section><section className="rounded-lg border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Pengadaan</h2>{procurement.length?<ul className="mt-3 divide-y divide-zinc-100">{procurement.map(item=><li key={item.id} className="flex justify-between gap-3 py-3"><span className="font-medium">{item.name} <span className="font-normal text-zinc-500">· {item.quantity} {item.unit||""}</span></span><span className="text-xs text-zinc-500">{procurementStatusLabel[item.status]||item.status}</span></li>)}</ul>:<p className="mt-2 text-sm text-zinc-500">Belum ada data pengadaan.</p>}</section></div>;
}
