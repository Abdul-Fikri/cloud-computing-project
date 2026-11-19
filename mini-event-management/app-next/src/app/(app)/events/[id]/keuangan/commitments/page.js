import {getEventContext} from "@/lib/events/get-event-context";
import {getMysqlPool} from "@/lib/mysql";
import FinanceSection from "@/components/events/FinanceSection";
export const metadata={title:"Semua Komitmen Pengadaan"};
export default async function AllCommitmentsPage({params}){
 const {id}=await params,{group}=await getEventContext(id),pool=getMysqlPool();
 const [[categories],[commitments]]=await Promise.all([
  pool.execute("SELECT id,name,planned_amount FROM budget_categories WHERE event_id=? AND group_id=? ORDER BY name",[id,group.id]),
  pool.execute("SELECT id,name,quantity,unit,est_unit_price,category_id FROM procurement_items WHERE event_id=? AND group_id=? AND status='ordered' ORDER BY created_at",[id,group.id])
 ]);
 return <FinanceSection eventId={id} categories={categories} transactions={[]} members={[]} commitments={commitments} standaloneView="commitments"/>;
}
