"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
import {procurementFields,procurementSchema} from "@/lib/validators/procurement";
import {fieldErrors,readForm} from "@/lib/validators/helpers";
import {getEventReturnPath} from "@/lib/events/return-path";
import {getTodayJakartaDate} from "@/lib/dates";
const empty={message:"",errors:{},values:{}},purchasedStatuses=new Set(["purchased","ready"]);
function procurementPaths(eventId,returnPath){revalidatePath(`/events/${eventId}`);revalidatePath(`/events/${eventId}/pengadaan`);revalidatePath(`/events/${eventId}/keuangan`);if(returnPath)revalidatePath(returnPath);}
function validateExpenseData(parsed,hasLinkedExpense,values){
 if(!purchasedStatuses.has(parsed.status)&&!hasLinkedExpense)return null;
 if(!parsed.actual_unit_price||parsed.actual_unit_price<=0)return {...empty,message:"Isi harga aktual lebih dari Rp0 sebelum item berstatus Sudah dibeli atau Siap digunakan.",errors:{actual_unit_price:"Harga aktual wajib lebih dari Rp0 agar tercatat di Keuangan."},values};
 const total=Math.round(parsed.actual_unit_price*parsed.quantity);
 if(!Number.isSafeInteger(total)||total<=0)return {...empty,message:"Total pembelian tidak valid. Periksa jumlah dan harga aktual.",errors:{actual_unit_price:"Total pembelian harus lebih dari Rp0 dan tidak melebihi batas nominal."},values};
 return null;
}
export async function saveProcurementItem(eventId,itemId,_prev,formData){
 const {group}=await requireGroup(),returnPath=getEventReturnPath(eventId,formData),values=readForm(formData,procurementFields),parsed=procurementSchema.safeParse(values);
 if(!parsed.success)return {...empty,message:"Periksa kembali data kebutuhan perlengkapan.",errors:fieldErrors(parsed.error),values};
 const pool=getMysqlPool(),[events]=await pool.execute("SELECT id FROM events WHERE id=? AND group_id=? LIMIT 1",[eventId,group.id]);if(!events.length)return {...empty,message:"Event tidak ditemukan.",values};
 const d=parsed.data;
 if(d.pic_member_id){const [a]=await pool.execute("SELECT id FROM event_members WHERE event_id=? AND group_id=? AND member_id=? LIMIT 1",[eventId,group.id,d.pic_member_id]);if(!a.length)return {...empty,message:"PIC harus terdaftar sebagai panitia event ini terlebih dahulu.",values};}
 if(d.category_id){const [c]=await pool.execute("SELECT id FROM budget_categories WHERE id=? AND event_id=? AND group_id=? LIMIT 1",[d.category_id,eventId,group.id]);if(!c.length)return {...empty,message:"Kategori anggaran tidak valid untuk event ini.",errors:{category_id:"Pilih kategori dari event ini."},values};}
 let existing=null,hasLinked=false;
 if(itemId){const [rows]=await pool.execute("SELECT id,status,purchased_date,actual_unit_price FROM procurement_items WHERE id=? AND event_id=? AND group_id=? LIMIT 1",[itemId,eventId,group.id]);existing=rows[0];if(!existing)return {...empty,message:"Data pengadaan tidak ditemukan.",values};
 const [linked]=await pool.execute("SELECT id FROM transactions WHERE procurement_item_id=? AND event_id=? AND group_id=? LIMIT 1",[itemId,eventId,group.id]);hasLinked=Boolean(linked[0]);
 if(hasLinked&&!purchasedStatuses.has(d.status))return {...empty,message:"Pembelian ini sudah tercatat sebagai pengeluaran. Status tidak dapat dikembalikan; gunakan Sudah dibeli atau Siap digunakan.",values};}
 const expenseError=validateExpenseData(d,hasLinked,values);if(expenseError)return expenseError;
 const transition=purchasedStatuses.has(d.status)&&(!existing||!purchasedStatuses.has(existing.status));
 const purchasedDate=d.purchased_date||existing?.purchased_date||(transition?getTodayJakartaDate():null);
 const cols=["name","specification","quantity","unit","est_unit_price","actual_unit_price","category_id","purchased_date","pic_member_id","status","supplier","notes"];
 const vals=[d.name,d.specification||null,d.quantity,d.unit||null,d.est_unit_price??null,d.actual_unit_price??null,d.category_id||null,purchasedDate,d.pic_member_id||null,d.status,d.supplier||null,d.notes||null];
 try{if(itemId){const [r]=await pool.execute(`UPDATE procurement_items SET ${cols.map(c=>c+"=?").join(",")} WHERE id=? AND event_id=? AND group_id=?`,[...vals,itemId,eventId,group.id]);if(!r.affectedRows)return {...empty,message:"Data pengadaan tidak ditemukan.",values};}
 else await pool.execute(`INSERT INTO procurement_items (id,group_id,event_id,${cols.join(",")}) VALUES (?,?,?,${cols.map(()=>"?").join(",")})`,[randomUUID(),group.id,eventId,...vals]);}
 catch(error){console.error("[saveProcurementItem]",error.code,error.message);return {...empty,message:"Data perlengkapan gagal disimpan. Periksa kembali datanya.",values};}
 procurementPaths(eventId,returnPath);redirect(returnPath);
}
export async function syncProcurementItemToFinance(formData){
 const {group}=await requireGroup(),eventId=String(formData.get("event_id")||""),itemId=String(formData.get("item_id")||"");if(!eventId||!itemId)return;
 const returnPath=getEventReturnPath(eventId,formData),pool=getMysqlPool(),connection=await pool.getConnection();
 try{
  await connection.beginTransaction();
  const [rows]=await connection.execute("SELECT id,name,quantity,actual_unit_price,purchased_date,status,category_id,pic_member_id FROM procurement_items WHERE id=? AND event_id=? AND group_id=? FOR UPDATE",[itemId,eventId,group.id]);
  const item=rows[0];if(!item){await connection.rollback();redirect(`${returnPath}?procurement_error=item_not_found`);}
  if(!purchasedStatuses.has(item.status)){await connection.rollback();redirect(`${returnPath}?procurement_error=not_purchased`);}
  if(!item.actual_unit_price||item.actual_unit_price<=0){await connection.rollback();redirect(`${returnPath}?procurement_error=missing_actual_price`);}
  if(!item.purchased_date){await connection.rollback();redirect(`${returnPath}?procurement_error=missing_purchase_date`);}
  const amount=Math.round(Number(item.actual_unit_price)*Number(item.quantity));if(!Number.isSafeInteger(amount)||amount<=0)throw new Error("Invalid procurement expense total");
  const [existing]=await connection.execute("SELECT id FROM transactions WHERE procurement_item_id=? LIMIT 1",[itemId]);
  const description="Pengadaan: "+item.name;
  if(existing.length)await connection.execute("UPDATE transactions SET category_id=?,trx_date=?,description=?,amount=?,recorded_by=? WHERE id=?",[item.category_id,item.purchased_date,description,amount,item.pic_member_id,existing[0].id]);
  else await connection.execute("INSERT INTO transactions (id,group_id,event_id,category_id,type,trx_date,description,amount,recorded_by,procurement_item_id) VALUES (?,?,?,?,'expense',?,?,?,?,?)",[randomUUID(),group.id,eventId,item.category_id,item.purchased_date,description,amount,item.pic_member_id,itemId]);
  await connection.commit();
 }catch(error){try{await connection.rollback();}catch{};if(error?.digest?.startsWith("NEXT_REDIRECT"))throw error;console.error("[syncProcurementItemToFinance]",error.code,error.message);redirect(`${returnPath}?procurement_error=sync_failed`);}
 finally{connection.release();}
 procurementPaths(eventId,returnPath);redirect(returnPath);
}
export async function deleteProcurementItem(formData){
 const {group}=await requireGroup(),eventId=String(formData.get("event_id")||""),itemId=String(formData.get("item_id")||"");if(!eventId||!itemId)return;
 const returnPath=getEventReturnPath(eventId,formData);
 try{await getMysqlPool().execute("DELETE FROM procurement_items WHERE id=? AND event_id=? AND group_id=?",[itemId,eventId,group.id]);}
 catch(error){console.error("[deleteProcurementItem]",error.code,error.message);throw new Error("Data perlengkapan gagal dihapus.");}
 procurementPaths(eventId,returnPath);redirect(returnPath);
}
