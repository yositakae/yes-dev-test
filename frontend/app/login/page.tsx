"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch(`${apiUrl}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.message ?? "เข้าสู่ระบบไม่สำเร็จ");
    localStorage.setItem("product-admin-token", payload.token);
    localStorage.setItem("product-admin-user", JSON.stringify(payload.user));
    window.location.href = "/";
  };
  return <main className="grid min-h-screen place-items-center bg-[#f6f8fb] p-6"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">เข้าสู่ระบบหลังบ้าน</h1><p className="mt-2 text-sm text-slate-500">สำหรับผู้ใช้ที่ได้รับเชิญเท่านั้น</p><label className="mt-6 block text-sm font-semibold">อีเมล<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><label className="mt-4 block text-sm font-semibold">รหัสผ่าน<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}<button className="mt-6 w-full rounded-xl bg-[#175cd3] px-4 py-3 font-semibold text-white">เข้าสู่ระบบ</button></form></main>;
}
