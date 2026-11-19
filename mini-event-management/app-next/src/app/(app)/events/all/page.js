import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {getEffectiveEventStatus} from "@/lib/events/status";
import EventList from "@/components/events/EventList";
export const metadata={title:"Semua Event"};
export default async function AllEventsPage(){
 const {group}=await requireGroup();
 const [events]=await getMysqlPool().execute("SELECT id,name,category,start_date,end_date,location,status,status_mode,planning_start_date,preparation_start_date,evaluation_end_date FROM events WHERE group_id=? ORDER BY start_date DESC",[group.id]);
 return <EventList events={events.map(event=>({...event,effectiveStatus:getEffectiveEventStatus(event)}))} standalone/>;
}
