import {notFound} from "next/navigation";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {getEffectiveEventStatus} from "@/lib/events/status";
export async function getEventContext(eventId){
 const {group}=await requireGroup(),pool=getMysqlPool();
 const [events]=await pool.execute(
  `SELECT e.*,m.full_name AS coordinator_name
     FROM events e LEFT JOIN members m ON m.id=e.coordinator_id
    WHERE e.id=? AND e.group_id=? LIMIT 1`,[eventId,group.id]
 );
 const row=events[0];if(!row)notFound();
 const [divisions]=await pool.execute("SELECT id,name,description FROM event_divisions WHERE event_id=? AND group_id=? ORDER BY name",[eventId,group.id]);
 const [members]=await pool.execute(
  `SELECT em.id,em.member_id,em.division_id,em.division,em.position_title,em.responsibility,
          m.full_name,m.contact
     FROM event_members em JOIN members m ON m.id=em.member_id
    WHERE em.event_id=? AND em.group_id=? ORDER BY m.full_name`,[eventId,group.id]
 );
 const event={...row,effective_status:getEffectiveEventStatus(row),coordinator:row.coordinator_id?{full_name:row.coordinator_name}:null};
 return {event,group,divisions,members};
}
