import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JW Admin — ระบบจัดการ License",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body style={{ margin:0, fontFamily:"'Sarabun', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
