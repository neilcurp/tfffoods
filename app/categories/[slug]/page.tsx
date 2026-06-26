"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import ProductGrid from "@/components/products/ProductGrid";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function CategoryProductsPage() {
  const { slug } = useParams() as { slug: string };
  const { t, language } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  // Fetch category details
  const { data: categoryData, error: categoryError } = useSWR(
    `/api/categories/${slug}?language=${language}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch category products
  const { data: productsData, error: productsError } = useSWR(
    `/api/products?category=${slug}&page=${currentPage}&limit=${limit}&language=${language}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const isLoading =
    (!categoryData && !categoryError) || (!productsData && !productsError);
  const isError = categoryError || productsError;

  if (isError) {
    console.error("Error loading category or products:", {
      categoryError,
      productsError,
    });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          {t("category.loadError")}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <LoadingSkeleton height="h-8" width="w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <LoadingSkeleton key={i} height="h-80" className="rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const categoryName =
    categoryData?.category?.displayNames?.[language] ||
    categoryData?.category?.name ||
    "";
  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;

  const breadcrumbItems = [
    {
      label: t("navigation.products"),
      href: "/products",
    },
    {
      label: categoryName,
      href: `/categories/${slug}`,
      current: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        {categoryName}
      </h1>
      <ProductGrid
        products={products}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
