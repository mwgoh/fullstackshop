"use client";

import { FormEvent, useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  ProductCategory,
  productCategories,
  productCategoryLabel,
} from "@/lib/productCategory";

export default function AdminProductsPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.products.listAllForAdmin,
    {},
    { initialNumItems: 20 },
  );
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
    category: productCategories[0],
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.image ? [form.image] : [],
        isActive: true,
        category: form.category,
      });
      setForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        image: "",
        category: productCategories[0],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="p-8 flex flex-col gap-8 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">상품 관리</h1>

      <form onSubmit={handleCreate} className="card flex flex-col gap-3 p-5">
        <h2 className="font-semibold">새 상품 등록</h2>
        <input
          required
          placeholder="상품명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
        />
        <textarea
          required
          placeholder="설명"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input"
        />
        <div className="flex gap-3">
          <input
            required
            type="number"
            min={0}
            placeholder="가격"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="input w-1/2"
          />
          <input
            required
            type="number"
            min={0}
            placeholder="재고"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="input w-1/2"
          />
        </div>
        <select
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value as ProductCategory,
            })
          }
          className="input"
        >
          {productCategories.map((category) => (
            <option key={category} value={category}>
              {productCategoryLabel[category]}
            </option>
          ))}
        </select>
        <input
          placeholder="이미지 URL (선택)"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          className="input"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className="btn-primary self-start"
        >
          {creating ? "등록 중..." : "등록"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">전체 상품</h2>
        {status === "LoadingFirstPage" ? (
          <p className="text-slate-500 text-sm">불러오는 중...</p>
        ) : results.length === 0 ? (
          <p className="text-slate-500 text-sm">등록된 상품이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((product) => (
              <AdminProductRow
                key={product._id}
                product={product}
                onSave={(patch) => updateProduct(patch)}
                onRemove={(productId) => removeProduct({ productId })}
              />
            ))}
          </ul>
        )}
        {status === "CanLoadMore" && (
          <button className="btn-secondary btn-sm mx-auto" onClick={() => loadMore(20)}>
            더 보기
          </button>
        )}
      </div>
    </main>
  );
}

function AdminProductRow({
  product,
  onSave,
  onRemove,
}: {
  product: Doc<"products">;
  onSave: (patch: {
    productId: Id<"products">;
    price: number;
    stock: number;
    isActive: boolean;
    category: ProductCategory;
  }) => Promise<unknown>;
  onRemove: (productId: Id<"products">) => Promise<unknown>;
}) {
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock);
  const [isActive, setIsActive] = useState(product.isActive);
  const [category, setCategory] = useState(product.category);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      await onSave({ productId: product._id, price, stock, isActive, category });
    } catch {
      setError("저장에 실패했습니다.");
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      await onRemove(product._id);
    } catch {
      setError("삭제에 실패했습니다.");
    }
  }

  return (
    <li className="card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex-1 min-w-32 text-sm font-medium truncate">
          {product.name}
        </span>
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="input w-24 py-1.5"
        />
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="input w-20 py-1.5"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
          className="input w-auto py-1.5"
        >
          {productCategories.map((c) => (
            <option key={c} value={c}>
              {productCategoryLabel[c]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          판매중
        </label>
        <button className="btn-ghost btn-sm" onClick={() => void handleSave()}>
          저장
        </button>
        <button
          className="btn-ghost btn-sm text-red-500 hover:text-red-600"
          onClick={() => void handleRemove()}
        >
          삭제
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </li>
  );
}
