"use client";

import { FormEvent, useEffect, useState } from "react";

export default function AcceptInvitePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { const value = new URLSearchParams(window.location.search).get("token") ?? ""; setToken(value); if (value) fetch(`${apiUrl}/auth/invite/${value}`).then((response) => response.ok ? response.json() : null).then((data) => data && setEmail(data.email)).catch(() => undefined); }, [apiUrl]);
  const submit = async (event: FormEvent) => { event.preventDefault(); const response = await fetch(`${apiUrl}/auth/invite/${token}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }); const payload = await response.json().catch(() => ({})); if (!response.ok) setError(payload.message ?? "ยืนยันคำเชิญไม่สำเร็จ"); else setMessage(payload.message); };
  return <main className="grid min-h-screen place-items-center bg-[#f6f8fb] p-6"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">ตั้งรหัสผ่าน Admin</h1><p className="mt-2 text-sm text-slate-500">บัญชี: {email || "กำลังตรวจสอบลิงก์..."}</p><label className="mt-6 block text-sm font-semibold">รหัสผ่านใหม่<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}{message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message} <a href="/login" className="font-bold underline">เข้าสู่ระบบ</a></p>}<button disabled={!token || Boolean(message)} className="mt-6 w-full rounded-xl bg-[#175cd3] px-4 py-3 font-semibold text-white disabled:bg-slate-300">ยืนยันและตั้งรหัสผ่าน</button></form></main>;
}
