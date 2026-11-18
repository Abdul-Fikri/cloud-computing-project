"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
const MAX_FILE_SIZE=2*1024*1024;
const TYPES={
 "image/jpeg":bytes=>bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff,
 "image/png":bytes=>bytes.length>=8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a,
 "image/webp":bytes=>bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP"
};
function validate(file){
 if(!(file instanceof File)||!file.size)return {ok:false,message:"Pilih file gambar terlebih dahulu."};
 if(file.size>MAX_FILE_SIZE)return {ok:false,message:"Ukuran logo maksimal 2 MB."};
 if(!TYPES[file.type])return {ok:false,message:"Format logo harus JPG, PNG, atau WebP."};
 return {ok:true};
}
export async function uploadGroupLogo(formData){
 const {owner,group}=await requireGroup(),file=formData.get("logo"),check=validate(file);if(!check.ok)return check;
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!TYPES[file.type](bytes))return {ok:false,message:"Isi file tidak sesuai dengan format gambar."};
 const url=`/api/groups/${group.id}/logo?v=${randomUUID()}`;
 try{await getMysqlPool().execute("UPDATE `groups` SET logo_url=?,logo_mime=?,logo_data=? WHERE id=? AND owner_id=?",[url,file.type,Buffer.from(bytes),group.id,owner.id]);}
 catch(error){console.error("[uploadGroupLogo]",error.code,error.message);return {ok:false,message:"Logo gagal disimpan ke database. Pastikan migration 002_group_logo_blob_storage.sql sudah diterapkan."};}
 revalidatePath("/", "layout");return {ok:true,message:"Logo grup berhasil diperbarui."};
}
export async function removeGroupLogo(){
 const {owner,group}=await requireGroup();
 try{await getMysqlPool().execute("UPDATE `groups` SET logo_url=NULL,logo_mime=NULL,logo_data=NULL WHERE id=? AND owner_id=?",[group.id,owner.id]);}
 catch(error){console.error("[removeGroupLogo]",error.code,error.message);return {ok:false,message:"Logo grup gagal dihapus. Pastikan schema database sudah diperbarui."};}
 revalidatePath("/", "layout");return {ok:true,message:"Logo grup berhasil dihapus."};
}
