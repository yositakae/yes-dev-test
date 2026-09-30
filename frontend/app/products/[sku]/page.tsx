type PublicProduct = {
  sku: string;
  name: string;
  price: number;
  size: string;
  type: string;
  description: string;
  howToUse: string;
  scanCount: number;
};

export default async function PublicProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  let product: PublicProduct | null = null;
  let notFound = false;
  try {
    const response = await fetch(`${apiUrl}/public/products/${encodeURIComponent(sku)}`, { cache: "no-store" });
    if (response.ok) product = await response.json();
    else notFound = true;
  } catch {
    notFound = true;
  }

  if (notFound || !product) return <main className="grid min-h-screen place-items-center bg-[#f6f8fb] p-6"><div className="rounded-3xl bg-white p-10 text-center shadow-sm"><p className="text-4xl">⌁</p><h1 className="mt-3 text-xl font-bold">ไม่พบสินค้านี้</h1><p className="mt-2 text-sm text-slate-500">สินค้าอาจถูกปิดใช้งานหรือไม่มีอยู่ในระบบ</p></div></main>;

  return <main className="min-h-screen bg-[#f6f8fb] p-6"><article className="mx-auto max-w-xl rounded-3xl bg-white p-7 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-[#175cd3]">Product information</p><h1 className="mt-3 text-3xl font-bold text-slate-950">{product.name}</h1><p className="mt-1 font-mono text-xs text-slate-400">{product.sku}</p><div className="my-7 flex items-end gap-2"><span className="text-3xl font-bold text-[#175cd3]">{product.price.toLocaleString()}</span><span className="pb-1 text-sm text-slate-500">บาท / {product.type}</span></div><div className="space-y-5 border-t border-slate-100 pt-5"><div><h2 className="text-sm font-bold">รายละเอียด</h2><p className="mt-1 text-sm leading-6 text-slate-600">{product.description || "-"}</p></div><div><h2 className="text-sm font-bold">วิธีใช้</h2><p className="mt-1 text-sm leading-6 text-slate-600">{product.howToUse || "-"}</p></div><div><h2 className="text-sm font-bold">ขนาด</h2><p className="mt-1 text-sm text-slate-600">{product.size || "-"}</p></div></div><p className="mt-8 text-center text-xs text-slate-400">เข้าชมแล้ว {product.scanCount.toLocaleString()} ครั้ง</p></article></main>;
}
