import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";

export default function ProductCard({
  product,
}: {
  product: Doc<"products">;
}) {
  const thumbnail = product.images[0];

  return (
    <Link
      href={`/products/${product._id}`}
      className="flex flex-col gap-2 rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden hover:opacity-80 transition-opacity"
    >
      <div className="aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- product images come from arbitrary admin-provided URLs
          <img
            src={thumbnail}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-slate-400">이미지 없음</span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-sm font-medium truncate">{product.name}</span>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {product.price.toLocaleString()}원
        </span>
        {product.stock === 0 && (
          <span className="text-xs text-red-500">품절</span>
        )}
      </div>
    </Link>
  );
}
