import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Admin | นำเข้าสินค้า",
  description: "ระบบนำเข้าสินค้าจากไฟล์ Excel",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
