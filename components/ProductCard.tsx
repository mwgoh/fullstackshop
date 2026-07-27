import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";

export default function ProductCard({
  product,
}: {
  product: Doc<"products">;
}) {
  const thumbnail = product.images[0];
  const soldOut = product.stock === 0;

  return (
    <Link
      href={`/products/${product._id}`}
      className="card card-hover group flex flex-col gap-0 overflow-hidden"
    >
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- product images come from arbitrary admin-provided URLs
          <img
            src={thumbnail}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-slate-400">
            이미지 없음
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="badge bg-white text-slate-900">품절</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="text-sm font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.name}
        </span>
        <span className="text-base font-bold">
          {product.price.toLocaleString()}원
        </span>
      </div>
    </Link>
  );
}
