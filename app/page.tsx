"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "jw@admin2569";

export default function LoginPage() {
  const router = useRouter();
  const [pw, setPw]     = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = () => {
    setError("");
    setLoading(true);
    if (pw === ADMIN_PASSWORD) {
      document.cookie = "jw-admin-auth=1; path=/; max-age=86400";
      router.push("/dashboard");
    } else {
      setError("รหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4f8", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"40px 36px", width:360, boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>

        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:28 }}>
          <div style={{ width:40, height:40, background:"#1e3a8a", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="20" height="20" fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#111827" }}>JW Admin</div>
            <div style={{ fontSize:11, color:"#6B7280" }}>ระบบจัดการ License</div>
          </div>
        </div>

        <div style={{ fontSize:13, color:"#6B7280", marginBottom:20 }}>กรุณาเข้าสู่ระบบเพื่อจัดการ</div>

        <div style={{ position:"relative", marginBottom:12 }}>
          <input
            type={show ? "text" : "password"}
            placeholder="รหัสผ่าน"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ width:"100%", padding:"10px 44px 10px 12px", borderRadius:8, border:"1px solid #E5E7EB", fontSize:14, boxSizing:"border-box" as const, outline:"none", fontFamily:"inherit" }}
          />
          <button onClick={() => setShow(s => !s)} style={{
            position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer", padding:4, color:"#9CA3AF",
          }}>
            {show ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>

        {error && <div style={{ fontSize:12, color:"#DC2626", marginBottom:10 }}>{error}</div>}

        <button onClick={login} disabled={loading} style={{
          width:"100%", background:"#1e3a8a", color:"#fff", border:"none",
          borderRadius:8, fontSize:14, fontWeight:600, padding:"11px", cursor:"pointer",
        }}>
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </div>
    </div>
  );
}
