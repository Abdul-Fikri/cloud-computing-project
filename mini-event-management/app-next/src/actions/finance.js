"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {budgetCategoryFields,budgetCategorySchema,transactionFields,transactionSchema} from "@/lib/validators/finance";
import {fieldErrors,readForm} from "@/lib/validators/helpers";
import {getEventReturnPath} from "@/lib/events/return-path";
const empty={message:"",errors:{},values:{}};
async function ownedEvent(pool,eventId,groupId){const [r]=await pool.execute("SELECT id FROM events WHERE id=? AND group_id=? LIMIT 1",[eventId,groupId]);return r[0]||null;}
export async function saveBudgetCategory(eventId,categoryId,_prev,formData){
 const {group}=await requireGroup(),returnPath=getEventReturnPath(eventId,formData),values=readForm(formData,budgetCategoryFields),parsed=budgetCategorySchema.safeParse(values);
 if(!parsed.success)return {...empty,message:"Periksa kembali kategori anggaran.",errors:fieldErrors(parsed.error),values};
 const pool=getMysqlPool();if(!await ownedEvent(pool,eventId,group.id))return {...empty,message:"Event tidak ditemukan.",values};
 try{if(categoryId){const [r]=await pool.execute("UPDATE budget_categories SET name=?,planned_amount=? WHERE id=? AND event_id=? AND group_id=?",[parsed.data.name,parsed.data.planned_amount,categoryId,eventId,group.id]);if(!r.affectedRows)return {...empty,message:"Kategori anggaran tidak ditemukan.",values};}
 else await pool.execute("INSERT INTO budget_categories (id,group_id,event_id,name,planned_amount) VALUES (?,?,?,?,?)",[randomUUID(),group.id,eventId,parsed.data.name,parsed.data.planned_amount]);}
 catch(error){console.error("[saveBudgetCategory]",error.code,error.message);return {...empty,message:error.code==="ER_DUP_ENTRY"?"Nama kategori tersebut sudah digunakan pada event ini.":"Kategori anggaran gagal disimpan.",values};}
 revalidatePath(`/events/${eventId}`);revalidatePath(`/events/${eventId}/pengadaan`);revalidatePath(returnPath);redirect(returnPath);
}
export async function deleteBudgetCategory(formData){
 const {group}=await requireGroup(),eventId=String(formData.get("event_id")||""),categoryId=String(formData.get("category_id")||"");if(!eventId||!categoryId)return;
 const returnPath=getEventReturnPath(eventId,formData);
 try{await getMysqlPool().execute("DELETE FROM budget_categories WHERE id=? AND event_id=? AND group_id=?",[categoryId,eventId,group.id]);}
 catch(error){if(error.code==="ER_ROW_IS_REFERENCED_2")redirect(`${returnPath}?finance_error=category_in_use`);throw new Error("Kategori anggaran gagal dihapus.");}
 revalidatePath(`/events/${eventId}`);revalidatePath(`/events/${eventId}/pengadaan`);revalidatePath(returnPath);redirect(returnPath);
}
export async function saveTransaction(eventId,transactionId,_prev,formData){
 const {group}=await requireGroup(),returnPath=getEventReturnPath(eventId,formData),values=readForm(formData,transactionFields),parsed=transactionSchema.safeParse(values);
 if(!parsed.success)return {...empty,message:"Periksa kembali data transaksi.",errors:fieldErrors(parsed.error),values};
 const pool=getMysqlPool();if(!await ownedEvent(pool,eventId,group.id))return {...empty,message:"Event tidak ditemukan.",values};
 if(parsed.data.category_id){const [r]=await pool.execute("SELECT id FROM budget_categories WHERE id=? AND event_id=? AND group_id=? LIMIT 1",[parsed.data.category_id,eventId,group.id]);if(!r.length)return {...empty,message:"Kategori tidak valid untuk event ini.",values};}
 if(parsed.data.recorded_by){const [r]=await pool.execute("SELECT id FROM members WHERE id=? AND group_id=? LIMIT 1",[parsed.data.recorded_by,group.id]);if(!r.length)return {...empty,message:"Pencatat transaksi tidak ditemukan pada grup ini.",values};}
 if(transactionId){const [r]=await pool.execute("SELECT procurement_item_id FROM transactions WHERE id=? AND event_id=? AND group_id=? LIMIT 1",[transactionId,eventId,group.id]);if(r[0]?.procurement_item_id)return {...empty,message:"Transaksi ini berasal dari Pengadaan. Ubah nominal, tanggal, atau kategorinya melalui halaman Pengadaan agar kedua halaman tetap sinkron.",values};}
 const d=parsed.data;
 try{if(transactionId){const [r]=await pool.execute("UPDATE transactions SET category_id=?,type=?,trx_date=?,description=?,amount=?,recorded_by=?,reference=? WHERE id=? AND event_id=? AND group_id=?",[d.category_id||null,d.type,d.trx_date,d.description,d.amount,d.recorded_by||null,d.reference||null,transactionId,eventId,group.id]);if(!r.affectedRows)return {...empty,message:"Transaksi tidak ditemukan.",values};}
 else await pool.execute("INSERT INTO transactions (id,group_id,event_id,category_id,type,trx_date,description,amount,recorded_by,reference) VALUES (?,?,?,?,?,?,?,?,?,?)",[randomUUID(),group.id,eventId,d.category_id||null,d.type,d.trx_date,d.description,d.amount,d.recorded_by||null,d.reference||null]);}
 catch(error){console.error("[saveTransaction]",error.code,error.message);return {...empty,message:"Transaksi gagal disimpan. Periksa kembali datanya.",values};}
 revalidatePath(`/events/${eventId}`);revalidatePath(returnPath);redirect(returnPath);
}
export async function deleteTransaction(formData){
 const {group}=await requireGroup(),eventId=String(formData.get("event_id")||""),transactionId=String(formData.get("transaction_id")||"");if(!eventId||!transactionId)return;
 const returnPath=getEventReturnPath(eventId,formData),pool=getMysqlPool(),[rows]=await pool.execute("SELECT procurement_item_id FROM transactions WHERE id=? AND event_id=? AND group_id=? LIMIT 1",[transactionId,eventId,group.id]);
 if(rows[0]?.procurement_item_id)redirect(`${returnPath}?finance_error=procurement_managed`);
 await pool.execute("DELETE FROM transactions WHERE id=? AND event_id=? AND group_id=?",[transactionId,eventId,group.id]);
 revalidatePath(`/events/${eventId}`);revalidatePath(returnPath);redirect(returnPath);
}
