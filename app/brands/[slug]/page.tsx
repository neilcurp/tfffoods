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

export default function BrandProductsPage() {
  const { slug } = useParams() as { slug: string };
  const { t, language } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  // Fetch brand details
  const { data: brandData, error: brandError } = useSWR(
    `/api/brands/${slug}?language=${language}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch brand products
  const { data: productsData, error: productsError } = useSWR(
    `/api/products?brand=${slug}&page=${currentPage}&limit=${limit}&language=${language}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const isLoading =
    (!brandData && !brandError) || (!productsData && !productsError);
  const isError = brandError || productsError;

  if (isError) {
    console.error("Error loading brand or products:", {
      brandError,
      productsError,
    });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          {t("brand.loadError")}
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

  const brandName =
    brandData?.brand?.displayNames?.[language] || brandData?.brand?.name || "";
  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;

  const breadcrumbItems = [
    {
      label: t("navigation.products"),
      href: "/products",
    },
    {
      label: brandName,
      href: `/brands/${slug}`,
      current: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <h1 className="text-2xl font-bold mb-6 text-foreground">{brandName}</h1>
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
