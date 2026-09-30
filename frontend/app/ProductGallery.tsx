type ProductGalleryProps = { name: string; photos?: string[] };

export default function ProductGallery({ name, photos = [] }: ProductGalleryProps) {
  if (!photos.length) {
    return <div className="mt-4 grid h-56 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-center text-slate-400"><div><div className="text-5xl">▧</div><p className="mt-2 text-sm">ยังไม่มีรูปสินค้า</p></div></div>;
  }
  return <div className="mt-4 grid grid-cols-2 gap-3">{photos.map((photo, index) => <img key={`${photo.slice(0, 30)}-${index}`} src={photo} alt={`${name || "สินค้า"} รูปที่ ${index + 1}`} className="h-48 w-full rounded-2xl object-cover" />)}</div>;
}
