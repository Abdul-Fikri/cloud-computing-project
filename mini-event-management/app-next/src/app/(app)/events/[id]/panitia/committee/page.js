import {getEventContext} from "@/lib/events/get-event-context";
import {getMysqlPool} from "@/lib/mysql";
import EventCommitteeList from "@/components/events/EventCommitteeList";
export const metadata={title:"Semua Susunan Panitia"};
export default async function EventCommitteeAllPage({params,searchParams}){
 const {id}=await params,query=await searchParams,{group}=await getEventContext(id),pool=getMysqlPool();
 const [[assignments],[members],[divisions]]=await Promise.all([
  pool.execute("SELECT id,member_id,division_id,division,position_title,responsibility FROM event_members WHERE event_id=? AND group_id=? ORDER BY created_at",[id,group.id]),
  pool.execute("SELECT id,full_name,contact FROM members WHERE group_id=? ORDER BY full_name",[group.id]),
  pool.execute("SELECT id,name,description FROM event_divisions WHERE event_id=? AND group_id=? ORDER BY name",[id,group.id])
 ]);
 const names=new Map(divisions.map(x=>[x.id,x.name])),byId=new Map(members.map(x=>[x.id,x]));
 const committee=assignments.map(x=>({...x,division:names.get(x.division_id)??x.division,member:byId.get(x.member_id)}));
 const requested=typeof query?.division==="string"?query.division:"all";
 const initialDivisionFilter=requested==="all"||requested==="unassigned"||divisions.some(x=>x.id===requested)?requested:"all";
 return <EventCommitteeList eventId={id} committee={committee} members={members} divisions={divisions} standalone initialSearch={typeof query?.q==="string"?query.q:""} initialDivisionFilter={initialDivisionFilter}/>;
}
