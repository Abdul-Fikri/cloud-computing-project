import Link from "next/link";
import {requirePanitia} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {EVENT_STATUS_LABELS,getEffectiveEventStatus} from "@/lib/events/status";
export const metadata={title:"Ruang Panitia"};
export default async function PanitiaHomePage(){
 const {member}=await requirePanitia(),pool=getMysqlPool();
 const [events]=await pool.execute(
  `SELECT e.id,e.name,e.start_date,e.end_date,e.status,e.status_mode,e.planning_start_date,e.preparation_start_date,e.evaluation_end_date,e.location,
          em.division,em.position_title,em.responsibility
     FROM event_members em JOIN events e ON e.id=em.event_id
    WHERE em.member_id=? ORDER BY e.start_date`,[member.id]
 );
 return <div className="space-y-5"><div><p className="text-sm text-zinc-500">Selamat datang, {member.full_name}</p><h1 className="text-2xl font-semibold">Event yang ditugaskan</h1><p className="mt-1 text-sm text-zinc-600">Kamu hanya dapat melihat event tempat kamu terdaftar sebagai panitia.</p></div>{events.length?<div className="grid gap-3 md:grid-cols-2">{events.map(event=><Link key={event.id} href={"/panitia/events/"+event.id} className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-indigo-300 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{event.name}</h2><span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">{EVENT_STATUS_LABELS[getEffectiveEventStatus(event)]}</span></div><p className="mt-2 text-sm text-zinc-600">{event.division||"Divisi belum ditentukan"}{event.position_title?" · "+event.position_title:""}</p><p className="mt-2 text-xs text-zinc-500">{event.start_date}{event.end_date&&event.end_date!==event.start_date?" – "+event.end_date:""} · {event.location||"Lokasi belum ditentukan"}</p><p className="mt-4 text-sm font-medium text-indigo-700">Buka ruang event →</p></Link>)}</div>:<div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">Belum ada event yang ditugaskan ke akun ini.</div>}</div>;
}
