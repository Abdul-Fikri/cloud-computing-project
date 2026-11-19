"use server";
import {randomBytes,createHash,randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {getSessionUser} from "@/lib/mysql-auth";
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function createMemberInvitation(_prev,formData){
 const {group}=await requireGroup(),memberId=String(formData.get("member_id")||""),email=String(formData.get("email")||"").trim().toLowerCase();
 if(!/^[0-9a-f-]{36}$/i.test(memberId)||!emailPattern.test(email)||email.length>320)return {ok:false,message:"Masukkan email yang valid."};
 const pool=getMysqlPool(),[members]=await pool.execute("SELECT id,auth_user_id FROM members WHERE id=? AND group_id=? LIMIT 1",[memberId,group.id]),member=members[0];
 if(!member)return {ok:false,message:"Data anggota tidak ditemukan."};
 if(member.auth_user_id)return {ok:false,message:"Anggota ini sudah terhubung ke akun."};
 const token=randomBytes(32).toString("hex"),tokenHash=createHash("sha256").update(token).digest("hex");
 try{await pool.execute("INSERT INTO member_invitations (id,group_id,member_id,email,token_hash,expires_at) VALUES (?,?,?,?,?,?)",[randomUUID(),group.id,memberId,email,tokenHash,new Date(Date.now()+48*60*60*1000)]);}
 catch(error){console.error("[createMemberInvitation]",error.code,error.message);return {ok:false,message:"Undangan gagal dibuat. Periksa kembali data anggota."};}
 revalidatePath("/members");return {ok:true,message:"Undangan berhasil dibuat. Kirim tautan ini kepada anggota.",link:"/join?token="+token};
}
export async function claimMemberInvitation(formData){
 const user=await getSessionUser();if(!user)redirect("/login");
 const token=String(formData.get("token")||"");if(!/^[a-f0-9]{64}$/i.test(token))redirect("/join?error=invalid");
 const tokenHash=createHash("sha256").update(token).digest("hex"),pool=getMysqlPool(),connection=await pool.getConnection();
 try{
  await connection.beginTransaction();
  const [rows]=await connection.execute(
   `SELECT i.id,i.group_id,i.member_id,i.email,i.expires_at,i.accepted_at,m.auth_user_id
      FROM member_invitations i JOIN members m ON m.id=i.member_id AND m.group_id=i.group_id
     WHERE i.token_hash=? LIMIT 1 FOR UPDATE`,[tokenHash]);
  const invitation=rows[0];
  if(!invitation||invitation.accepted_at||new Date(invitation.expires_at)<=new Date()||invitation.email.toLowerCase()!==user.email.toLowerCase()||invitation.auth_user_id){
   await connection.rollback();redirect("/join?error=claim");
  }
  await connection.execute("UPDATE members SET auth_user_id=? WHERE id=? AND group_id=? AND auth_user_id IS NULL",[user.id,invitation.member_id,invitation.group_id]);
  await connection.execute("UPDATE member_invitations SET accepted_at=CURRENT_TIMESTAMP(3) WHERE id=? AND accepted_at IS NULL",[invitation.id]);
  await connection.commit();
 }catch(error){try{await connection.rollback();}catch{};if(error?.digest?.startsWith("NEXT_REDIRECT"))throw error;console.error("[claimMemberInvitation]",error.code,error.message);redirect("/join?error=claim");}
 finally{connection.release();}
 revalidatePath("/panitia");redirect("/panitia");
}
