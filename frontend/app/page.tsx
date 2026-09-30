"use client";

import { ChangeEvent, useEffect, useState } from "react";

type InvalidRow = { row: number; sku?: string; name?: string; status: "inactive"; errors: string[] };
type Product = { id?: number; sku: string; name: string; categoryId?: number; price: number; size?: string; type: string; description?: string; howToUse?: string; status: "active" | "inactive"; qrProducts: string; scanCount?: number };
type ImportResult = { importedCount: number; invalidCount: number; invalidRows: InvalidRow[]; products: Product[] };
type EditDraft = { sku: string; name: string; categoryId: string; price: string; size: string; type: string; description: string; howToUse: string; status: "active" | "inactive" };
type ProductPhoto = { id: number; photoUrl: string };
type UserRole = "SUPER_ADMIN" | "ADMIN";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const isValidSku = (sku: string) => /^LS-\d+$/.test(sku);
const productIssues = (product: Product) => {
  const issues: string[] = [];
  if (!product.sku || !isValidSku(product.sku)) issues.push("SKU ไม่ถูกต้อง");
  if (!product.name?.trim()) issues.push("ต้องระบุชื่อสินค้า");
  if (!product.categoryId) issues.push("ต้องระบุหมวดหมู่");
  if (product.price === undefined || product.price === null || product.price <= 0) issues.push("ต้องตรวจสอบราคา");
  if (!["g", "ml", "ชิ้น"].includes(product.type)) issues.push("ต้องระบุหน่วย g, ml หรือ ชิ้น");
  return issues;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [qr, setQr] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrTarget, setQrTarget] = useState("");
  const [qrOptions, setQrOptions] = useState({ darkColor: "#111827", lightColor: "#ffffff", width: 300 });
  const [photos, setPhotos] = useState<ProductPhoto[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [userDraft, setUserDraft] = useState({ email: "" });

  useEffect(() => {
    const token = window.localStorage.getItem("product-admin-token");
    const user = JSON.parse(window.localStorage.getItem("product-admin-user") ?? "null") as { role?: UserRole } | null;
    if (!token) { window.location.href = "/login"; return; }
    if (user?.role) setRole(user.role);
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${apiUrl}/products`, { headers }).then((response) => response.ok ? response.json() : []).then((items: Product[]) => setProducts(items)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem("product-admin-token");
    if (role === "SUPER_ADMIN" && token) fetch(`${apiUrl}/products/popular`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.ok ? response.json() : []).then((items: Product[]) => setPopularProducts(items)).catch(() => undefined);
    else setPopularProducts([]);
  }, [role]);

  const createUser = async () => {
    const response = await fetch(`${apiUrl}/auth/invite`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.localStorage.getItem("product-admin-token") ?? ""}` }, body: JSON.stringify(userDraft) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.message ?? "เพิ่มผู้ใช้ไม่สำเร็จ");
    setUserDraft({ email: "" });
    setError("");
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setResult(null);
    setError("");
  };

  const importFile = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${apiUrl}/products/import`, { method: "POST", headers: { Authorization: `Bearer ${window.localStorage.getItem("product-admin-token") ?? ""}` }, body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message ?? "นำเข้าไฟล์ไม่สำเร็จ");
      setResult(payload);
      setProducts(payload.products ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  const openQrCustomizer = (sku: string) => { setQrTarget(sku); setQr(""); };

  const createQr = async (sku: string, options?: typeof qrOptions) => {
    if (!options) {
      const existing = products.find((item) => item.sku === sku)?.qrProducts;
      if (existing) {
        setQr(existing);
        setQrTarget("");
      } else {
        openQrCustomizer(sku);
      }
      return;
    }
    const response = await fetch(`${apiUrl}/products/${encodeURIComponent(sku)}/qr`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.localStorage.getItem("product-admin-token") ?? ""}` }, body: JSON.stringify({ publicBaseUrl: window.location.origin, ...options }) });
    const product = await response.json();
    if (!response.ok) return setError(product.message ?? "สร้าง QR ไม่สำเร็จ");
    setQr(product.qrProducts);
    setProducts((items) => items.map((item) => item.sku === sku ? { ...item, qrProducts: product.qrProducts } : item));
    setQrTarget("");
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    if (!photo || !editing?.sku) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(photo.type)) {
      setError("ไฟล์ไม่ถูกต้อง กรุณาใช้เฉพาะไฟล์ JPG, PNG หรือ WEBP");
      event.target.value = "";
      return;
    }
    if (photo.size > 2 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป ขนาดต้องไม่เกิน 2 MB");
      event.target.value = "";
      return;
    }
    setError("");
    const formData = new FormData();
    formData.append("file", photo);
    const response = await fetch(`${apiUrl}/products/${encodeURIComponent(editing.sku)}/photos`, { method: "POST", headers: { Authorization: `Bearer ${window.localStorage.getItem("product-admin-token") ?? ""}` }, body: formData });
    const uploaded = await response.json().catch(() => null);
    if (!response.ok) setError("อัปโหลดรูปสินค้าไม่สำเร็จ");
    else if (uploaded) setPhotos((items) => [...items, uploaded]);
    event.target.value = "";
  };

  const deletePhoto = async (photoId: number) => {
    if (!editing?.sku) return;
    const response = await fetch(`${apiUrl}/products/${encodeURIComponent(editing.sku)}/photos/${photoId}`, { method: "DELETE", headers: { Authorization: `Bearer ${window.localStorage.getItem("product-admin-token") ?? ""}` } });
    if (response.ok) setPhotos((items) => items.filter((photo) => photo.id !== photoId));
    else setError("ลบรูปสินค้าไม่สำเร็จ");
  };

  const toggleStatus = async (product: Product) => {
    const status = product.status === "active" ? "inactive" : "active";
    const response = await fetch(`${apiUrl}/products/${encodeURIComponent(product.sku)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.localStorage.getItem("product-admin-token") ?? ""}` }, body: JSON.stringify({ status }) });
    if (response.ok) setProducts((items) => items.map((item) => item.sku === product.sku ? { ...item, status } : item));
  };

  const openEdit = async (product: Product) => {
    setEditing(product);
    setPhotos([]);
    setDraft({ sku: product.sku, name: product.name, categoryId: product.categoryId ? String(product.categoryId) : "", price: product.price ? String(product.price) : "", size: product.size ?? "", type: product.type, description: product.description ?? "", howToUse: product.howToUse ?? "", status: product.status });
    if (product.sku) {
      const response = await fetch(`${apiUrl}/products/${encodeURIComponent(product.sku)}/photos`, { headers: { Authorization: `Bearer ${window.localStorage.getItem("product-admin-token") ?? ""}` } });
      if (response.ok) setPhotos(await response.json());
    }
  };

  const saveEdit = async () => {
    if (!editing || !draft) return;
    setSaving(true);
    const endpoint = editing.id ? `${apiUrl}/products/id/${editing.id}` : `${apiUrl}/products/${encodeURIComponent(editing.sku)}`;
    const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.localStorage.getItem("product-admin-token") ?? ""}` }, body: JSON.stringify({ sku: draft.sku || undefined, name: draft.name, categoryId: draft.categoryId ? Number(draft.categoryId) : undefined, price: draft.price ? Number(draft.price) : undefined, size: draft.size, type: draft.type, description: draft.description, howToUse: draft.howToUse, status: draft.status }) });
    const updated = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return setError(updated.message ?? "บันทึกข้อมูลไม่สำเร็จ");
    setProducts((items) => items.map((item) => item.id === editing.id ? { ...item, ...updated } : item));
    setPopularProducts((items) => items.map((item) => item.id === editing.id ? { ...item, ...updated } : item));
    setEditing(null);
    setDraft(null);
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#175cd3] text-xl text-white shadow-lg shadow-blue-200">P</div><div><p className="text-lg font-bold tracking-tight">Product Admin</p><p className="text-xs text-slate-500">จัดการข้อมูลสินค้า</p></div></div>
          <div className="flex items-center gap-3"><span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</span><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">● ระบบพร้อมใช้งาน</span></div>
        </header>
        <section className="mb-8"><p className="mb-2 text-sm font-semibold text-[#175cd3]">นำเข้าข้อมูล</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">นำเข้าสินค้าจาก Excel</h1><p className="mt-2 text-sm text-slate-500">อัปโหลดไฟล์เพื่อเพิ่มสินค้าหลายรายการในครั้งเดียว ระบบจะแจ้งแถวที่ข้อมูลไม่ถูกต้องให้ตรวจสอบ</p></section>
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold">อัปโหลดไฟล์</h2><span className="text-xs text-slate-400">รองรับ .xlsx, .xls</span></div><label className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 text-center transition hover:border-blue-300 hover:bg-blue-50/40"><input type="file" accept=".xlsx,.xls" onChange={selectFile} className="sr-only" /><div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-2xl text-[#175cd3]">↥</div>{file ? <><p className="font-semibold text-slate-800">{file.name}</p><p className="mt-1 text-xs text-slate-500">พร้อมนำเข้า • {(file.size / 1024).toFixed(1)} KB</p></> : <><p className="font-semibold text-slate-800">คลิกเพื่อเลือกไฟล์ Excel</p><p className="mt-1 text-xs text-slate-500">หรือลากไฟล์มาวางที่นี่</p></>}</label><button disabled={!file || loading} onClick={importFile} className="mt-5 w-full rounded-xl bg-[#175cd3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1249aa] disabled:cursor-not-allowed disabled:bg-slate-300">{loading ? "กำลังตรวจสอบและนำเข้า..." : "เริ่มนำเข้าข้อมูล"}</button>{error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{result && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">นำเข้าสำเร็จ {result.importedCount} รายการ{result.invalidCount ? ` และพบข้อมูลผิด ${result.invalidCount} แถว` : " ไม่มีข้อมูลผิดพลาด"}</div>}</section>
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-4 font-bold">รูปแบบคอลัมน์</h2><p className="mb-4 text-xs leading-5 text-slate-500">แถวแรกต้องเป็นหัวตาราง โดยต้องมีคอลัมน์ต่อไปนี้</p><div className="space-y-2 text-sm">{["sku — รหัสสินค้า เช่น LS-1013", "name — ชื่อสินค้า", "category_id หรือ category", "price — ราคา", "type หรือ size — 5g / 500ml / 1ชิ้น"].map((item) => <div key={item} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"><span className="text-emerald-600">✓</span>{item}</div>)}</div><div className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">คอลัมน์เสริม: description, how_to_use, status (ค่าเริ่มต้นคือ active) ถ้าใส่ 5g ในคอลัมน์ size ระบบจะแยก size/type ให้อัตโนมัติ</div></aside>
        </div>
        {result?.invalidRows.length ? <section className="mt-6 overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-6 py-4"><div><h2 className="font-bold text-amber-900">สินค้าที่ต้องแก้ไข</h2><p className="mt-1 text-xs text-amber-700">ระบบบันทึกสินค้าแล้ว แต่ตั้งสถานะเป็น inactive จนกว่าจะแก้ไขข้อมูล</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{result.invalidCount} รายการ</span></div><div className="divide-y divide-slate-100">{result.invalidRows.map((item) => <div key={item.row} className="grid gap-3 px-6 py-4 sm:grid-cols-[180px_1fr_auto]"><div className="text-sm font-semibold text-slate-700">แถวที่ {item.row}<br /><span className="font-mono text-xs font-normal text-slate-400">{item.sku || "ยังไม่มี SKU"}</span><br /><span className="text-xs font-normal text-slate-500">{item.name || "ยังไม่มีชื่อสินค้า"}</span></div><div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">สิ่งที่ต้องแก้</p><p className="text-sm text-red-600">{item.errors.join(" • ")}</p></div><span className="h-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">inactive</span></div>)}</div></section> : null}
        {products.filter((product) => !isValidSku(product.sku)).length > 0 && <section className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-orange-900">สินค้าที่ต้องแก้ไข SKU</h2><p className="mt-1 text-xs text-orange-700">แสดงเฉพาะ SKU ที่ไม่ตรงรูปแบบ LS-ตัวเลข</p></div><span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">{products.filter((product) => !isValidSku(product.sku)).length} รายการ</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{products.filter((product) => !isValidSku(product.sku)).map((product, index) => <button key={`${product.id ?? index}-review`} onClick={() => openEdit(product)} className="flex items-center justify-between rounded-xl border border-orange-100 bg-white px-4 py-3 text-left hover:border-orange-300"><span><span className="block font-mono text-xs text-slate-400">{product.sku || "ยังไม่มี SKU"}</span><span className="block text-sm font-semibold text-slate-800">{product.name || "ยังไม่มีชื่อสินค้า"}</span></span><span className="text-xs font-semibold text-orange-700">แก้ไข →</span></button>)}</div></section>}
        {products.filter((product) => product.status === "inactive").length > 0 && <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-amber-900">สินค้าที่ต้องตรวจสอบข้อมูล</h2><p className="mt-1 text-xs text-amber-700">สินค้า inactive พร้อมรายละเอียดช่องที่ต้องแก้ไข</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{products.filter((product) => product.status === "inactive").length} รายการ</span></div><div className="mt-4 grid gap-3 md:grid-cols-2">{products.filter((product) => product.status === "inactive").map((product, index) => { const issues = productIssues(product); return <button key={`${product.id ?? index}-inactive-review`} onClick={() => openEdit(product)} className="rounded-xl border border-amber-100 bg-white px-4 py-3 text-left hover:border-amber-300"><div className="flex items-start justify-between gap-3"><span><span className="block font-mono text-xs text-slate-400">{product.sku || "ยังไม่มี SKU"}</span><span className="block text-sm font-semibold text-slate-800">{product.name || "ยังไม่มีชื่อสินค้า"}</span></span><span className="text-xs font-semibold text-amber-700">แก้ไข →</span></div><p className="mt-2 text-xs text-red-600">{issues.length ? issues.join(" • ") : "ตรวจสอบสถานะ inactive และเปิดใช้งานเมื่อพร้อม"}</p></button>; })}</div></section>}
        {role === "SUPER_ADMIN" && <section className="mt-6 rounded-3xl border border-violet-100 bg-violet-50/60 p-6"><h2 className="font-bold text-violet-950">เชิญ Admin</h2><p className="mt-1 text-xs text-violet-700">กรอกเฉพาะอีเมล ระบบจะส่งลิงก์ให้ตั้งรหัสผ่านเอง</p><div className="mt-4 flex max-w-xl gap-3"><input placeholder="อีเมลของ Admin" type="email" value={userDraft.email} onChange={(event) => setUserDraft({ email: event.target.value })} className="min-w-0 flex-1 rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm" /><button onClick={createUser} className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white">ส่งคำเชิญ</button></div></section>}
        {products.length > 0 && <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-6 py-4"><h2 className="font-bold">รายการสินค้า</h2><p className="mt-1 text-xs text-slate-500">แก้ไขข้อมูล สร้าง QR และเปิด/ปิดการแสดงผลสินค้าได้จากรายการนี้</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-3">SKU</th><th className="px-6 py-3">สินค้า</th><th className="px-6 py-3">ราคา / ปริมาณ</th><th className="px-6 py-3">สถานะ</th><th className="px-6 py-3 text-right">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product, index) => <tr key={`${product.sku || "empty"}-${product.id ?? index}`}><td className="px-6 py-4 font-mono text-xs">{product.sku || "ยังไม่มี SKU"}</td><td className="px-6 py-4 font-medium">{product.name || "ยังไม่มีชื่อสินค้า"}</td><td className="px-6 py-4">{product.price ? product.price.toLocaleString() : "-"} บาท / {product.size ? `${product.size} ` : ""}{product.type || "ไม่ระบุหน่วย"}</td><td className="px-6 py-4"><button disabled={!product.sku} onClick={() => toggleStatus(product)} className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${product.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{product.status === "active" ? "active" : "inactive"}</button></td><td className="space-x-2 px-6 py-4 text-right"><button onClick={() => openEdit(product)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">แก้ไข</button>{product.sku && <button onClick={() => createQr(product.sku)} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#175cd3] hover:bg-blue-100">{product.qrProducts ? "ดู QR" : "สร้าง QR"}</button>}</td></tr>)}</tbody></table></div></section>}
        {role === "SUPER_ADMIN" && popularProducts.length > 0 && <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/60 p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">สินค้าที่ถูกดูมากที่สุด</h2><p className="mt-1 text-xs text-slate-500">จัดอันดับจากจำนวนการเปิดหน้าสินค้าผ่าน QR</p></div><span className="text-xs font-semibold text-[#175cd3]">บันทึกใน log_scan</span></div><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{popularProducts.slice(0, 6).map((product, index) => <div key={product.id ?? product.sku} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"><div className="min-w-0"><p className="text-xs font-bold text-[#175cd3]">อันดับ {index + 1}</p><p className="truncate text-sm font-semibold">{product.name || "ยังไม่มีชื่อสินค้า"}</p><p className="font-mono text-[11px] text-slate-400">{product.sku}</p></div><p className="ml-3 whitespace-nowrap text-sm font-bold text-slate-700">{product.scanCount ?? 0} ครั้ง</p></div>)}</div></section>}
        {editing && draft && <div className="fixed inset-0 z-20 overflow-y-auto bg-slate-950/40 px-4 py-8" onClick={() => !saving && setEditing(null)}><div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold text-[#175cd3]">แก้ไขข้อมูลสินค้า</p><h2 className="mt-1 text-xl font-bold">{editing.sku || "สินค้ายังไม่มี SKU"}</h2></div><button onClick={() => setEditing(null)} className="text-xl text-slate-400">×</button></div><div className="grid gap-4 sm:grid-cols-2">{([["sku", "SKU (เช่น LS-1013)", "text"], ["name", "ชื่อสินค้า", "text"], ["categoryId", "Category ID", "number"], ["price", "ราคา", "number"], ["size", "ขนาด", "text"], ["type", "หน่วย (g / ml / ชิ้น)", "text"]] as const).map(([key, label, inputType]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input type={inputType} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#175cd3]" /></label>)}<label className="text-sm font-medium text-slate-700">สถานะ<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as EditDraft["status"] })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="active">active</option><option value="inactive">inactive</option></select></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">รายละเอียด<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#175cd3]" /></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">วิธีใช้<textarea value={draft.howToUse} onChange={(event) => setDraft({ ...draft, howToUse: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#175cd3]" /></label></div><section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><div><h3 className="font-semibold">รูปสินค้า</h3><p className="mt-1 text-xs text-slate-500">รูปเดิมจะแสดงที่นี่ สามารถลบหรือเพิ่มรูปใหม่ได้</p></div><label className="cursor-pointer rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">เพิ่มรูป<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={uploadPhoto} className="sr-only" /></label></div><p className="mt-2 text-xs text-slate-500">รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 2 MB</p>{photos.length > 0 ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo) => <div key={photo.id} className="relative overflow-hidden rounded-xl bg-white"><img src={photo.photoUrl} alt="รูปสินค้า" className="h-32 w-full object-cover" /><button type="button" onClick={() => deletePhoto(photo.id)} className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white">ลบ</button></div>)}</div> : <p className="mt-4 text-center text-xs text-slate-400">ยังไม่มีรูปสินค้า</p>}</section><div className="mt-6 flex justify-end gap-3"><button onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600">ยกเลิก</button><button disabled={saving} onClick={saveEdit} className="rounded-xl bg-[#175cd3] px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300">{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button></div></div></div>}
        {qr && <div className="fixed inset-0 z-10 grid place-items-center bg-slate-950/40 px-6" onClick={() => setQr("")}><div className="rounded-3xl bg-white p-6 text-center shadow-xl" onClick={(event) => event.stopPropagation()}><h2 className="font-bold">QR สินค้า</h2><img src={qr} alt="QR สินค้า" className="mx-auto my-4 h-64 w-64" /><a href={qr} download="product-qr.png" className="rounded-xl bg-[#175cd3] px-4 py-2 text-sm font-semibold text-white">ดาวน์โหลด QR</a></div></div>}
        {qrTarget && <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/40 px-6"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold">ปรับแต่ง QR สินค้า</h2><div className="mt-4 grid grid-cols-2 gap-4"><label className="text-sm font-medium">สี QR<input type="color" value={qrOptions.darkColor} onChange={(event) => setQrOptions({ ...qrOptions, darkColor: event.target.value })} className="mt-2 h-10 w-full" /></label><label className="text-sm font-medium">สีพื้นหลัง<input type="color" value={qrOptions.lightColor} onChange={(event) => setQrOptions({ ...qrOptions, lightColor: event.target.value })} className="mt-2 h-10 w-full" /></label></div><label className="mt-4 block text-sm font-medium">ขนาด: {qrOptions.width}px<input type="range" min="120" max="1200" step="10" value={qrOptions.width} onChange={(event) => setQrOptions({ ...qrOptions, width: Number(event.target.value) })} className="mt-2 w-full" /></label><div className="mt-6 flex justify-end gap-3"><button onClick={() => setQrTarget("")} className="rounded-xl px-4 py-2 text-sm text-slate-600">ยกเลิก</button><button onClick={() => createQr(qrTarget, qrOptions)} className="rounded-xl bg-[#175cd3] px-4 py-2 text-sm font-semibold text-white">สร้าง QR</button></div></div></div>}
      </div>
    </main>
  );
}
