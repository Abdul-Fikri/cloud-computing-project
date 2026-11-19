import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import MemberList from "@/components/members/MemberList";
export const metadata={title:"Semua Anggota Panitia"};
export default async function AllMembersPage(){
 const {group}=await requireGroup();
 const [members]=await getMysqlPool().execute("SELECT id,full_name,contact,created_at,auth_user_id FROM members WHERE group_id=? ORDER BY full_name",[group.id]);
 return <MemberList members={members} standalone/>;
}
