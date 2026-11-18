import {getEventContext} from "@/lib/events/get-event-context";
import {getMysqlPool} from "@/lib/mysql";
import TaskKanbanBoard from "@/components/events/TaskKanbanBoard";
export const metadata={title:"Tugas Event"};
export default async function EventTasksPage({params}){
 const {id}=await params,{group}=await getEventContext(id),pool=getMysqlPool();
 const [[tasks],[members]]=await Promise.all([
  pool.execute("SELECT * FROM tasks WHERE event_id=? AND group_id=? ORDER BY due_date,created_at",[id,group.id]),
  pool.execute("SELECT DISTINCT m.id,m.full_name FROM event_members em JOIN members m ON m.id=em.member_id WHERE em.event_id=? AND em.group_id=? ORDER BY m.full_name",[id,group.id])
 ]);
 return <TaskKanbanBoard eventId={id} tasks={tasks} members={members}/>;
}
