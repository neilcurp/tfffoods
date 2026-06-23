"use client";

import { use, useEffect, useState } from "react";
import axios from "axios";
import type { Product } from "@/types";
import ProductView from "@/components/products/ProductView";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCart } from "@/providers/cart/CartContext";

export default function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = use(params);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const { addItem } = useCart();

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/products?brand=${brand}`);
        setProducts(response.data.products || []);
        setTotalPages(Math.ceil((response.data.total || 0) / 12));
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [brand]);

  useEffect(() => {
    const handleAddToCart = (e: Event) => {
      const product = (e as CustomEvent<Product>).detail;
      addItem(product);
    };

    const handleToggleWishlist = async (e: Event) => {
      if (!session) {
        router.push("/login");
        return;
      }

      const productId = (e as CustomEvent<string>).detail;
      try {
        if (wishlist.includes(productId)) {
          const response = await axios.delete("/api/wishlist", {
            data: { productId },
          });
          if (response.status === 200) {
            setWishlist((prev) => prev.filter((id) => id !== productId));
            toast.success("Removed from wishlist");
          }
        } else {
          const response = await axios.post("/api/wishlist", { productId });
          if (response.status === 200) {
            setWishlist((prev) => [...prev, productId]);
            toast.success("Added to wishlist");
          }
        }
      } catch (error) {
        console.error("Error updating wishlist:", error);
        toast.error("Failed to update wishlist");
      }
    };

    window.addEventListener("product:addToCart", handleAddToCart);
    window.addEventListener("product:toggleWishlist", handleToggleWishlist);

    return () => {
      window.removeEventListener("product:addToCart", handleAddToCart);
      window.removeEventListener(
        "product:toggleWishlist",
        handleToggleWishlist
      );
    };
  }, [session, router, wishlist, addItem]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{brand} Collection</h1>
        <ProductView
          products={products}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </main>
  );
}
