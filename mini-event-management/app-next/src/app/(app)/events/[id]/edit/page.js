import Link from "next/link";
import {notFound} from "next/navigation";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import EventForm from "@/components/events/EventForm";
export const metadata={title:"Edit Event"};
export default async function EditEventPage({params}){
 const {id}=await params,{group}=await requireGroup(),pool=getMysqlPool();
 const [[events],[members]]=await Promise.all([
  pool.execute("SELECT * FROM events WHERE id=? AND group_id=? LIMIT 1",[id,group.id]),
  pool.execute("SELECT id,full_name FROM members WHERE group_id=? ORDER BY full_name",[group.id])
 ]);
 const event=events[0];if(!event)notFound();
 return <div className="space-y-5"><div><Link href={`/events/${id}`} className="management-link text-sm hover:underline">← Kembali ke detail</Link><h1 className="mt-2 text-2xl font-semibold">Edit event</h1></div><div className="management-panel p-5 sm:p-6"><EventForm event={event} members={members}/></div></div>;
}
