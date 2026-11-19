import {getEventContext} from "@/lib/events/get-event-context";
import {getMysqlPool} from "@/lib/mysql";
import ScheduleSection from "@/components/events/ScheduleSection";
export const metadata={title:"Rundown Event"};
export default async function EventSchedulePage({params}){
 const {id}=await params,{group,event}=await getEventContext(id),pool=getMysqlPool();
 const [[schedule],[members]]=await Promise.all([
  pool.execute("SELECT * FROM schedule_items WHERE event_id=? AND group_id=? ORDER BY item_date,start_time,sort_order",[id,group.id]),
  pool.execute("SELECT DISTINCT m.id,m.full_name FROM event_members em JOIN members m ON m.id=em.member_id WHERE em.event_id=? AND em.group_id=? ORDER BY m.full_name",[id,group.id])
 ]);
 return <ScheduleSection eventId={id} eventStartDate={event.start_date} schedule={schedule} members={members}/>;
}
