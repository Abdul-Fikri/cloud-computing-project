import Link from "next/link";
import {notFound} from "next/navigation";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import MemberForm from "@/components/members/MemberForm";
export const metadata={title:"Edit Anggota"};
export default async function EditMemberPage({params}){
 const {id}=await params,{group}=await requireGroup();
 const [rows]=await getMysqlPool().execute("SELECT id,full_name,contact FROM members WHERE id=? AND group_id=? LIMIT 1",[id,group.id]);
 const member=rows[0];if(!member)notFound();
 return <div className="space-y-5"><div><Link href="/members" className="management-link text-sm hover:underline">← Kembali ke anggota</Link><h1 className="mt-2 text-2xl font-semibold">Edit anggota</h1></div><div className="management-panel p-5 sm:p-6"><MemberForm member={member}/></div></div>;
}
