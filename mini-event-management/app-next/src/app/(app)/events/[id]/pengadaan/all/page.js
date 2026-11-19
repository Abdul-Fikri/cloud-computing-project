import {getEventContext} from "@/lib/events/get-event-context";
import {getMysqlPool} from "@/lib/mysql";
import ProcurementSection from "@/components/events/ProcurementSection";
export const metadata={title:"Semua Pengadaan Event"};
export default async function AllProcurementPage({params,searchParams}){
 const {id}=await params,query=await searchParams,{group}=await getEventContext(id),pool=getMysqlPool();
 const [[items],[members],[categories],[linked]]=await Promise.all([
  pool.execute("SELECT * FROM procurement_items WHERE event_id=? AND group_id=? ORDER BY created_at",[id,group.id]),
  pool.execute("SELECT DISTINCT m.id,m.full_name FROM event_members em JOIN members m ON m.id=em.member_id WHERE em.event_id=? AND em.group_id=? ORDER BY m.full_name",[id,group.id]),
  pool.execute("SELECT id,name FROM budget_categories WHERE event_id=? AND group_id=? ORDER BY name",[id,group.id]),
  pool.execute("SELECT procurement_item_id FROM transactions WHERE event_id=? AND group_id=? AND procurement_item_id IS NOT NULL",[id,group.id])
 ]);
 return <ProcurementSection eventId={id} items={items} members={members} categories={categories} linkedProcurementIds={linked.map(x=>x.procurement_item_id).filter(Boolean)} procurementError={query?.procurement_error??""} standalone/>;
}
