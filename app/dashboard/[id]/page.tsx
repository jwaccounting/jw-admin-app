"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, License, LicenseLog, toThaiDate, daysLeft } from "@/lib/supabase";

export default function MachineDetailPage() {
  const router = useRouter();
  const { id }  = useParams<{ id: string }>();
  const [lic, setLic]   = useState<License|null>(null);
  const [logs, setLogs] = useState<LicenseLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: licData } = await supabase.from("licenses").select("*").eq("id", id).single();
      setLic(licData);
      if (licData) {
        const { data: logData } = await supabase
          .from("license_logs")
          .select("*")
          .eq("machine_id", licData.machine_id)
          .order("created_at", { ascending: false })
          .limit(30);
        setLogs(logData ?? []);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const dl = daysLeft(lic?.expire_date ?? null);

  const actionLabel: Record<string,string> = {
    granted: "เข้าใช้งาน",
    denied:  "ถูกปฏิเสธ",
    expired: "หมดอายุ",
  };
  const actionColor: Record<string,string> = {
    granted: "#166534",
    denied:  "#991B1B",
    expired: "#92400E",
  };
  const actionBg: Record<string,string> = {
    granted: "#DCFCE7",
    denied:  "#FEE2E2",
    expired: "#FEF3C7",
  };

  if (loading) return <div style={{ padding:40, fontFamily:"sans-serif", color:"#9CA3AF" }}>กำลังโหลด...</div>;
  if (!lic)   return <div style={{ padding:40, fontFamily:"sans-serif", color:"#DC2626" }}>ไม่พบข้อมูล</div>;

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4f8", fontFamily:"sans-serif" }}>

      {/* TopBar */}
      <div style={{ background:"#1e3a8a", padding:"0 28px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => router.push("/dashboard")}
            style={{ background:"rgba(255,255,255,0.12)", color:"#bfdbfe", border:"none", borderRadius:6, fontSize:12, padding:"4px 12px", cursor:"pointer" }}>
            ← กลับ
          </button>
          <span style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{lic.customer_name}</span>
        </div>
      </div>

      <div style={{ padding:"24px 28px", maxWidth:900, margin:"0 auto" }}>

        {/* License card */}
        <div style={{ background:"#1e3a8a", borderRadius:12, padding:"20px 24px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ fontSize:11, color:"#93c5fd", margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.06em" }}>License</p>
            <p style={{ fontSize:20, fontWeight:700, color:"#fff", margin:"0 0 4px" }}>{lic.customer_name}</p>
            <p style={{ fontSize:12, color:"#bfdbfe", margin:0, fontFamily:"monospace" }}>{lic.machine_id}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:11, color:"#93c5fd", margin:"0 0 2px" }}>แพ็กเกจ</p>
            <p style={{ fontSize:18, fontWeight:700, color:"#fff", margin:"0 0 4px" }}>{lic.plan}</p>
            <p style={{ fontSize:13, color: dl<=7?"#fca5a5":"#bfdbfe", margin:0 }}>หมดอายุ {toThaiDate(lic.expire_date)}</p>
            <span style={{ display:"inline-block", marginTop:8, background: lic.is_active?"rgba(220,252,231,0.2)":"rgba(254,226,226,0.2)", color: lic.is_active?"#86efac":"#fca5a5", fontSize:11, fontWeight:600, padding:"2px 10px", borderRadius:99 }}>
              {lic.is_active ? "ใช้งานได้" : "ระงับ"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          <div style={{ background:"#fff", border:"0.5px solid #E5E7EB", borderRadius:10, padding:"14px 16px" }}>
            <p style={{ fontSize:11, color:"#6B7280", margin:"0 0 4px" }}>เหลืออีก</p>
            <p style={{ fontSize:22, fontWeight:700, color: dl<=7?"#DC2626":dl<=30?"#D97706":"#166534", margin:0 }}>{dl >= 9999 ? "∞" : dl} <span style={{ fontSize:13, fontWeight:400 }}>วัน</span></p>
          </div>
          <div style={{ background:"#fff", border:"0.5px solid #E5E7EB", borderRadius:10, padding:"14px 16px" }}>
            <p style={{ fontSize:11, color:"#6B7280", margin:"0 0 4px" }}>เข้าใช้งาน (ทั้งหมด)</p>
            <p style={{ fontSize:22, fontWeight:700, color:"#111827", margin:0 }}>{logs.filter(l=>l.action==="granted").length}</p>
          </div>
          <div style={{ background:"#fff", border:"0.5px solid #E5E7EB", borderRadius:10, padding:"14px 16px" }}>
            <p style={{ fontSize:11, color:"#6B7280", margin:"0 0 4px" }}>ถูกปฏิเสธ</p>
            <p style={{ fontSize:22, fontWeight:700, color:"#DC2626", margin:0 }}>{logs.filter(l=>l.action!=="granted").length}</p>
          </div>
        </div>

        {/* History */}
        <div style={{ background:"#fff", border:"0.5px solid #E5E7EB", borderRadius:12, padding:"16px 20px" }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 12px" }}>ประวัติการเข้าใช้งาน</p>
          {logs.length === 0 ? (
            <p style={{ color:"#9CA3AF", fontSize:13 }}>ยังไม่มีประวัติ</p>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                  {["วันเวลา","การกระทำ","เวอร์ชัน Agent"].map(h => (
                    <th key={h} style={{ textAlign:"left", padding:"8px 10px", fontSize:11, color:"#6B7280", fontWeight:600, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom:"0.5px solid #F9FAFB" }}>
                    <td style={{ padding:"9px 10px", color:"#6B7280" }}>
                      {new Date(log.created_at).toLocaleString("th-TH")}
                    </td>
                    <td style={{ padding:"9px 10px" }}>
                      <span style={{ background: actionBg[log.action]??"#F3F4F6", color: actionColor[log.action]??"#374151", padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:600 }}>
                        {actionLabel[log.action] ?? log.action}
                      </span>
                    </td>
                    <td style={{ padding:"9px 10px", fontFamily:"monospace", fontSize:12, color:"#6B7280" }}>{log.agent_ver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
