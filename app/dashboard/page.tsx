"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, License, PaymentNotification, toThaiDate, daysLeft } from "@/lib/supabase";

const S = {
  page:   { minHeight:"100vh", background:"#f0f4f8", fontFamily:"sans-serif" } as React.CSSProperties,
  topbar: { background:"#1e3a8a", padding:"0 28px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky" as const, top:0, zIndex:10 },
  body:   { padding:"24px 28px", maxWidth:1200, margin:"0 auto" },
  secLbl: { fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase" as const, letterSpacing:"0.07em", margin:"0 0 12px" },
};

const PLANS = ["รายเดือน","รายปี","ตลอดไป","กำหนดเอง (วัน)"];
const PLAN_DAYS: Record<string,number> = { "รายเดือน":30, "รายปี":365 };

function addDays(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString();
}

export default function DashboardPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [payments, setPayments] = useState<PaymentNotification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState<string|null>(null);
  const [editForm, setEditForm] = useState({ customer_name:"", plan:"รายเดือน", expire_days:"30", is_active:true });
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState<"machines"|"payments">("machines");

  const logout = () => { document.cookie="jw-admin-auth=; path=/; max-age=0"; router.push("/"); };

  const fetchData = async () => {
    setLoading(true);
    const [lic, pay] = await Promise.all([
      supabase.from("licenses").select("*").order("created_at", { ascending:false }),
      supabase.from("payment_notifications").select("*").order("created_at", { ascending:false }),
    ]);
    setLicenses(lic.data ?? []);
    setPayments(pay.data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const toggleActive = async (lic: License) => {
    await supabase.from("licenses").update({ is_active:!lic.is_active }).eq("id", lic.id);
    fetchData();
  };

  const openEdit = (lic: License) => {
    setEditId(lic.id);
    setEditForm({ customer_name:lic.customer_name, plan:lic.plan??"รายเดือน", expire_days:"30", is_active:lic.is_active });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    const days = editForm.plan==="กำหนดเอง (วัน)" ? parseInt(editForm.expire_days)||30 : PLAN_DAYS[editForm.plan]??30;
    await supabase.from("licenses").update({
      customer_name: editForm.customer_name,
      plan: editForm.plan,
      expire_date: editForm.plan==="ตลอดไป" ? null : addDays(days),
      is_active: editForm.is_active,
    }).eq("id", editId);
    setEditId(null); setSaving(false); fetchData();
  };

  const deleteLic = async (id: string) => {
    if (!confirm("ยืนยันลบเครื่องนี้?")) return;
    await supabase.from("licenses").delete().eq("id", id); fetchData();
  };

  const approvePayment = async (pay: PaymentNotification) => {
    await supabase.from("payment_notifications").update({ status:"approved" }).eq("id", pay.id);
    if (pay.machine_id) await supabase.from("licenses").update({ is_active:true, expire_date:addDays(30) }).eq("machine_id", pay.machine_id);
    fetchData();
  };

  const rejectPayment = async (id: number) => {
    await supabase.from("payment_notifications").update({ status:"rejected" }).eq("id", id); fetchData();
  };

  const active   = licenses.filter(l => l.is_active).length;
  const expiring = licenses.filter(l => l.is_active && daysLeft(l.expire_date) <= 7).length;
  const pending  = payments.filter(p => p.status==="pending").length;

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, background:"rgba(255,255,255,0.15)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"#fff", lineHeight:1 }}>JW Admin</div>
            <div style={{ fontSize:11, color:"#93c5fd", lineHeight:1, marginTop:2 }}>ระบบจัดการ License</div>
          </div>
        </div>
        <button onClick={logout} style={{ background:"rgba(255,255,255,0.18)", color:"#fff", border:"0.5px solid rgba(255,255,255,0.3)", borderRadius:8, fontSize:13, fontWeight:600, padding:"8px 22px", cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          ออกจากระบบ
        </button>
      </div>

      <div style={S.body}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:"เครื่องทั้งหมด", val:licenses.length, color:"#0C447C", bg:"#dbeafe" },
            { label:"ใช้งานอยู่",      val:active,          color:"#166534", bg:"#dcfce7" },
            { label:"ใกล้หมดอายุ",    val:expiring,        color:"#92400e", bg:"#fef3c7" },
            { label:"รอยืนยันชำระ",   val:pending,         color:"#991b1b", bg:"#fee2e2" },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontSize:11, color:s.color, fontWeight:600, marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {(["machines","payments"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:"7px 18px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
              background:tab===t?"#1e3a8a":"#fff", color:tab===t?"#fff":"#374151",
              border:tab===t?"none":"0.5px solid #E5E7EB",
            }}>
              {t==="machines" ? `เครื่องทั้งหมด (${licenses.length})` : `การแจ้งชำระ${pending>0?` (${pending} รอ)`:""}`}
            </button>
          ))}
        </div>

        {tab==="machines" && (
          <div style={{ background:"#fff", border:"0.5px solid #E5E7EB", borderRadius:12, padding:"16px 20px" }}>
            <p style={S.secLbl}>รายการเครื่องที่ลงทะเบียน</p>
            {loading ? <p style={{ color:"#9CA3AF", fontSize:13 }}>กำลังโหลด...</p> : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                    {["ชื่อลูกค้า","Machine ID","แพ็กเกจ","หมดอายุ","เหลือ (วัน)","สถานะ","จัดการ"].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"8px 10px", fontSize:11, color:"#6B7280", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {licenses.map(lic => {
                    const dl = daysLeft(lic.expire_date);
                    return (
                      <tr key={lic.id} style={{ borderBottom:"0.5px solid #F9FAFB" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="#F9FAFB")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <td style={{ padding:"10px 10px" }}>
                          <button onClick={() => router.push(`/dashboard/${lic.id}`)} style={{ background:"none", border:"none", cursor:"pointer", color:"#1d4ed8", fontSize:13, fontWeight:600, padding:0 }}>
                            {lic.customer_name || "—"}
                          </button>
                        </td>
                        <td style={{ padding:"10px 10px", fontFamily:"monospace", fontSize:11, color:"#6B7280" }}>{lic.machine_id?.slice(0,18)}...</td>
                        <td style={{ padding:"10px 10px" }}>{lic.plan}</td>
                        <td style={{ padding:"10px 10px", color:dl<=7?"#DC2626":"#111827" }}>{toThaiDate(lic.expire_date)}</td>
                        <td style={{ padding:"10px 10px" }}>
                          <span style={{ background:dl<=7?"#FEF2F2":dl<=30?"#FFFBEB":"#F0FDF4", color:dl<=7?"#DC2626":dl<=30?"#92400E":"#166534", padding:"2px 8px", borderRadius:99, fontSize:11, fontWeight:600 }}>
                            {dl>=9999?"∞":dl}
                          </span>
                        </td>
                        <td style={{ padding:"10px 10px" }}>
                          <button onClick={() => toggleActive(lic)} style={{ background:lic.is_active?"#DCFCE7":"#FEE2E2", color:lic.is_active?"#166534":"#991B1B", border:"none", borderRadius:99, fontSize:11, fontWeight:600, padding:"3px 10px", cursor:"pointer" }}>
                            {lic.is_active?"ใช้งาน":"ระงับ"}
                          </button>
                        </td>
                        <td style={{ padding:"10px 10px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => openEdit(lic)} style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"0.5px solid #E5E7EB", background:"#fff", cursor:"pointer", color:"#374151" }}>แก้ไข</button>
                            <button onClick={() => deleteLic(lic.id)} style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"none", background:"#FEE2E2", cursor:"pointer", color:"#991B1B" }}>ลบ</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab==="payments" && (
          <div style={{ background:"#fff", border:"0.5px solid #E5E7EB", borderRadius:12, padding:"16px 20px" }}>
            <p style={S.secLbl}>การแจ้งชำระเงิน</p>
            {payments.length===0 ? <p style={{ color:"#9CA3AF", fontSize:13 }}>ยังไม่มีการแจ้งชำระ</p> : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                    {["ชื่อผู้โอน","จำนวน","วันที่โอน","วันที่แจ้ง","สถานะ","จัดการ"].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"8px 10px", fontSize:11, color:"#6B7280", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay.id} style={{ borderBottom:"0.5px solid #F9FAFB" }}>
                      <td style={{ padding:"10px 10px", fontWeight:600, color:"#111827" }}>{pay.name}</td>
                      <td style={{ padding:"10px 10px", color:"#166534", fontWeight:600 }}>{pay.amount} บาท</td>
                      <td style={{ padding:"10px 10px" }}>{pay.date}</td>
                      <td style={{ padding:"10px 10px", color:"#6B7280", fontSize:12 }}>{new Date(pay.created_at).toLocaleDateString("th-TH")}</td>
                      <td style={{ padding:"10px 10px" }}>
                        <span style={{ background:pay.status==="approved"?"#DCFCE7":pay.status==="rejected"?"#FEE2E2":"#FEF3C7", color:pay.status==="approved"?"#166534":pay.status==="rejected"?"#991B1B":"#92400E", padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:600 }}>
                          {pay.status==="approved"?"อนุมัติแล้ว":pay.status==="rejected"?"ปฏิเสธ":"รอยืนยัน"}
                        </span>
                      </td>
                      <td style={{ padding:"10px 10px" }}>
                        {pay.status==="pending" && (
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => approvePayment(pay)} style={{ fontSize:11, padding:"4px 12px", borderRadius:6, border:"none", background:"#DCFCE7", color:"#166534", cursor:"pointer", fontWeight:600 }}>อนุมัติ</button>
                            <button onClick={() => rejectPayment(pay.id)} style={{ fontSize:11, padding:"4px 12px", borderRadius:6, border:"none", background:"#FEE2E2", color:"#991B1B", cursor:"pointer" }}>ปฏิเสธ</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {editId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:"28px 32px", width:420, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#111827", marginBottom:20 }}>แก้ไข License</div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>ชื่อลูกค้า</label>
              <input value={editForm.customer_name} onChange={e => setEditForm(f=>({...f,customer_name:e.target.value}))}
                style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #E5E7EB", fontSize:13, boxSizing:"border-box", outline:"none" }} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:8 }}>แพ็กเกจ</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {PLANS.map(p => (
                  <button key={p} onClick={() => setEditForm(f=>({...f,plan:p}))} style={{
                    padding:"9px", borderRadius:8, fontSize:13, cursor:"pointer", textAlign:"center",
                    background: editForm.plan===p?"#dbeafe":"#F9FAFB",
                    color: editForm.plan===p?"#1e3a8a":"#6B7280",
                    border: editForm.plan===p?"1.5px solid #93c5fd":"1px solid #E5E7EB",
                    fontWeight: editForm.plan===p?600:400,
                  }}>{p}</button>
                ))}
              </div>
            </div>

            {editForm.plan!=="ตลอดไป" && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>
                  {editForm.plan==="กำหนดเอง (วัน)" ? "จำนวนวัน" : `ต่ออายุ — ค่าเริ่มต้น ${PLAN_DAYS[editForm.plan]} วัน`}
                </label>
                <input type="number" value={editForm.expire_days}
                  onChange={e => setEditForm(f=>({...f,expire_days:e.target.value}))}
                  placeholder={String(PLAN_DAYS[editForm.plan]??30)}
                  style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #E5E7EB", fontSize:13, boxSizing:"border-box", outline:"none" }} />
              </div>
            )}

            <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
              <input type="checkbox" id="is_active" checked={editForm.is_active} onChange={e => setEditForm(f=>({...f,is_active:e.target.checked}))} />
              <label htmlFor="is_active" style={{ fontSize:13, color:"#374151" }}>เปิดใช้งาน</label>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setEditId(null)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#fff", color:"#6B7280", fontSize:13, cursor:"pointer" }}>ยกเลิก</button>
              <button onClick={saveEdit} disabled={saving} style={{ flex:2, padding:"10px", borderRadius:8, border:"none", background:"#1e3a8a", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {saving?"กำลังบันทึก...":"บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
