"use client";

import { ChangeEvent, useState } from "react";

export default function PhotoUploader({ sku, apiUrl }: { sku: string; apiUrl: string }) {
  const [message, setMessage] = useState("");
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${apiUrl}/products/${encodeURIComponent(sku)}/photos`, { method: "POST", body: formData });
    setMessage(response.ok ? "อัปโหลดรูปแล้ว" : "อัปโหลดรูปไม่สำเร็จ");
  };
  return <div className="fixed bottom-6 left-6 z-30 flex items-center gap-3 rounded-2xl bg-white p-2 shadow-xl"><label className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">อัปโหลดรูปสินค้า<input type="file" accept="image/*" onChange={upload} className="sr-only" /></label>{message && <span className="px-2 text-xs text-slate-500">{message}</span>}</div>;
}
