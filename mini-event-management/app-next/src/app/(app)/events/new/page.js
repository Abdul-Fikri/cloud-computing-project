import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import EventForm from "@/components/events/EventForm";
export const metadata={title:"Buat Event"};
export default async function NewEventPage(){
 const {group}=await requireGroup();
 const [members]=await getMysqlPool().execute("SELECT id,full_name FROM members WHERE group_id=? ORDER BY full_name",[group.id]);
 return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">Buat event baru</h1><p className="mt-1 text-sm text-zinc-600">Lengkapi informasi dasar dan timeline event.</p></div><div className="management-panel p-5 sm:p-6"><EventForm members={members}/></div></div>;
}
