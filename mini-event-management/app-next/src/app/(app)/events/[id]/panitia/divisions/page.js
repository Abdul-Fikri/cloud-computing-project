import {getEventContext} from "@/lib/events/get-event-context";
import {getMysqlPool} from "@/lib/mysql";
import EventDivisionManager from "@/components/events/EventDivisionManager";
export const metadata={title:"Semua Divisi Event"};
export default async function EventDivisionsPage({params,searchParams}){
 const {id}=await params,query=await searchParams,{group}=await getEventContext(id);
 const [divisions]=await getMysqlPool().execute("SELECT id,name,description FROM event_divisions WHERE event_id=? AND group_id=? ORDER BY name",[id,group.id]);
 return <EventDivisionManager eventId={id} divisions={divisions} standalone initialSearch={typeof query?.q==="string"?query.q:""}/>;
}
