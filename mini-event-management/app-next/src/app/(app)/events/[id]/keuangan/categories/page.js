import {getEventContext} from "@/lib/events/get-event-context";
import {getMysqlPool} from "@/lib/mysql";
import FinanceSection from "@/components/events/FinanceSection";
export const metadata={title:"Semua Kategori Anggaran"};
export default async function AllBudgetCategoriesPage({params,searchParams}){
 const {id}=await params,query=await searchParams,{group,event}=await getEventContext(id),pool=getMysqlPool();
 const [[categories],[transactions],[members],[commitments]]=await Promise.all([
  pool.execute("SELECT * FROM budget_categories WHERE event_id=? AND group_id=? ORDER BY name",[id,group.id]),
  pool.execute("SELECT * FROM transactions WHERE event_id=? AND group_id=? ORDER BY trx_date DESC,created_at DESC",[id,group.id]),
  pool.execute("SELECT id,full_name FROM members WHERE group_id=? ORDER BY full_name",[group.id]),
  pool.execute("SELECT id,name,quantity,unit,est_unit_price,category_id FROM procurement_items WHERE event_id=? AND group_id=? AND status='ordered' ORDER BY created_at",[id,group.id])
 ]);
 return <FinanceSection eventId={id} targetBudget={event.target_budget} categories={categories} transactions={transactions} members={members} commitments={commitments} financeError={query?.finance_error??""} standaloneView="categories"/>;
}
