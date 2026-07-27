import { Doc } from "@/convex/_generated/dataModel";

export type ProductCategory = NonNullable<Doc<"products">["category"]>;

export const productCategoryLabel: Record<ProductCategory, string> = {
  home_living: "홈 & 리빙",
  books: "도서",
  fashion: "패션",
  electronics: "전자기기",
};

export const productCategories = Object.keys(
  productCategoryLabel,
) as ProductCategory[];
