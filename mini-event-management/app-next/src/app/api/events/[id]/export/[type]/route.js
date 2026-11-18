import {requireGroup} from "@/lib/auth";
import {getMysqlPool} from "@/lib/mysql";
const configs={
 members:{filename:"anggota-panitia",headers:["Nama","Kontak"],sql:"SELECT full_name,contact FROM members WHERE group_id=? ORDER BY full_name",map:r=>[r.full_name,r.contact]},
 committee:{filename:"susunan-panitia",headers:["Nama anggota","Kontak","Divisi","Jabatan","Tanggung jawab"],sql:"SELECT m.full_name,m.contact,COALESCE(d.name,em.division) AS division,em.position_title,em.responsibility FROM event_members em JOIN members m ON m.id=em.member_id LEFT JOIN event_divisions d ON d.id=em.division_id WHERE em.event_id=? AND em.group_id=? ORDER BY em.created_at",map:r=>[r.full_name,r.contact,r.division,r.position_title,r.responsibility]},
 schedule:{filename:"rundown",headers:["Tanggal","Waktu mulai","Waktu selesai","Agenda","Lokasi","PIC","Catatan","Urutan"],sql:"SELECT s.item_date,s.start_time,s.end_time,s.title,s.location,m.full_name AS pic,s.notes,s.sort_order FROM schedule_items s LEFT JOIN members m ON m.id=s.pic_member_id WHERE s.event_id=? AND s.group_id=? ORDER BY s.item_date,s.start_time,s.sort_order",map:r=>[r.item_date,r.start_time,r.end_time,r.title,r.location,r.pic,r.notes,r.sort_order]},
 tasks:{filename:"daftar-tugas",headers:["Tugas","Deskripsi","PIC","Deadline","Prioritas","Status","Catatan"],sql:"SELECT t.title,t.description,m.full_name AS assignee,t.due_date,t.priority,t.status,t.notes FROM tasks t LEFT JOIN members m ON m.id=t.assigned_to WHERE t.event_id=? AND t.group_id=? ORDER BY t.due_date,t.created_at",map:r=>[r.title,r.description,r.assignee,r.due_date,r.priority,r.status,r.notes]},
 procurement:{filename:"pengadaan",headers:["Nama kebutuhan","Spesifikasi","Jumlah","Satuan","Estimasi harga satuan","Harga aktual satuan","PIC","Status","Supplier","Catatan"],sql:"SELECT p.name,p.specification,p.quantity,p.unit,p.est_unit_price,p.actual_unit_price,m.full_name AS pic,p.status,p.supplier,p.notes FROM procurement_items p LEFT JOIN members m ON m.id=p.pic_member_id WHERE p.event_id=? AND p.group_id=? ORDER BY p.created_at",map:r=>[r.name,r.specification,r.quantity,r.unit,r.est_unit_price,r.actual_unit_price,r.pic,r.status,r.supplier,r.notes]},
 finance:{filename:"transaksi-keuangan",headers:["Jenis","Tanggal","Deskripsi","Nominal","Kategori","Dicatat oleh","Referensi"],sql:"SELECT t.type,t.trx_date,t.description,t.amount,c.name AS category,m.full_name AS recorder,t.reference FROM transactions t LEFT JOIN budget_categories c ON c.id=t.category_id LEFT JOIN members m ON m.id=t.recorded_by WHERE t.event_id=? AND t.group_id=? ORDER BY t.trx_date DESC,t.created_at DESC",map:r=>[r.type==="income"?"Pemasukan":"Pengeluaran",r.trx_date,r.description,r.amount,r.category,r.recorder,r.reference]}
};
function csvCell(value){let text=value==null?"":String(value);if(/^[\s]*[=+@]/.test(text)||/^[\s]*-/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
function safeFilename(value){return String(value||"event").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||"event";}
export async function GET(_request,{params}){
 const {id,type}=await params,config=configs[type];if(!config)return new Response("Jenis ekspor tidak ditemukan.",{status:404});
 const {group}=await requireGroup(),pool=getMysqlPool(),[events]=await pool.execute("SELECT id,name FROM events WHERE id=? AND group_id=? LIMIT 1",[id,group.id]),event=events[0];
 if(!event)return new Response("Event tidak ditemukan.",{status:404});
 const args=type==="members"?[group.id]:[id,group.id];
 try{const [data]=await pool.execute(config.sql,args),rows=[config.headers,...data.map(config.map)],csv="\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n"),filename=safeFilename(event.name)+"-"+config.filename+".csv";
 return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="'+filename+'"',"Cache-Control":"private, no-store"}});
 }catch(error){console.error("[event-csv-export]",type,error.code,error.message);return new Response("Data gagal diekspor.",{status:500});}
}
