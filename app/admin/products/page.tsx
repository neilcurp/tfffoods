"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/providers/language/LanguageContext";
import { LayoutDashboard, Package } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useConfirm } from "@/components/ui/confirm-provider";

interface Product {
  _id: string;
  name: string;
  slug: string;
  order: number;
  brand: {
    _id: string;
    name: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  price: number;
  originalPrice: number;
  images: string[];
  createdAt: string;
  draft?: boolean;
  lastSaved?: Date;
  specifications?: Record<string, string>;
  displayNames?: Record<string, string>;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation();
  const confirm = useConfirm();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  // Add states for products
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("product.admin.title"),
      href: "/admin/products",
      icon: Package,
    },
  ];

  // Memoize loadProducts function
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/products?includeDrafts=true&limit=100&language=${language}`
      );
      setProducts(response.data.products || []);
      setError(null);
    } catch (err) {
      console.error("Error loading products:", err);
      setError(err as Error);
      toast.error(t("product.admin.error"));
    } finally {
      setIsLoading(false);
    }
  }, [language, t]); // Only recreate when language or translations change

  // Load products on mount and language change
  useEffect(() => {
    if (status === "authenticated" && session?.user?.admin) {
      loadProducts();
    }
  }, [status, session, language, loadProducts]);

  // Filter products and drafts
  const activeProducts = products.filter((p) => !p.draft);
  const draftProducts = products.filter((p) => p.draft);

  // Add logging for data changes
  useEffect(() => {
    if (products) {
      console.log("📈 Products data changed:", {
        total: products.length,
        active: activeProducts.length,
        drafts: draftProducts.length,
        timestamp: new Date().toISOString(),
      });
    }
  }, [products, activeProducts.length, draftProducts.length]);

  // Event listener for product deletion
  useEffect(() => {
    const handleProductDelete = (event: Event) => {
      const customEvent = event as CustomEvent;
      const deletedProductId = customEvent.detail?.productId;

      // Only update if this event wasn't triggered by our own delete handler
      if (customEvent.detail?.source !== "admin-list") {
        console.log("🔄 Updating list from event");
        loadProducts();
      }
    };

    window.addEventListener("product:deleted", handleProductDelete);
    return () => {
      window.removeEventListener("product:deleted", handleProductDelete);
    };
  }, [loadProducts]);

  // Auto-switch to grid view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setViewMode("grid");
      } else {
        setViewMode("table");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redirect if not admin
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.admin) {
      toast.error(t("common.error"));
      router.push("/");
    }
  }, [status, session, router, t]);

  // Show loading for initial load or when checking auth
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
      </div>
    );
  }

  // Show error if any
  if (error) {
    toast.error(t("product.admin.error"));
    console.error("Error fetching products:", error);
  }

  // Return null if not authenticated or not admin (will redirect in useEffect)
  if (status === "authenticated" && !session?.user?.admin) {
    return null;
  }

  const handleDeleteProduct = async (productId: string, productName?: string) => {
    const confirmed = await confirm({
      title: t("product.admin.actions.delete"),
      description: productName
        ? `${t("product.admin.delete.confirm")} (${productName})`
        : t("product.admin.delete.confirm"),
      confirmText: t("product.admin.actions.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;

    console.log("🗑️ Delete initiated:", {
      productId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Delete from API first
      const response = await axios.delete(`/api/products/manage/${productId}`);
      console.log("🎯 API Delete Response:", response.data);

      if (response.data.deletedProductId) {
        // Just reload the products list
        await loadProducts();

        // Still dispatch event for other components that might need it
        window.dispatchEvent(
          new CustomEvent("product:deleted", {
            detail: {
              productId,
              timestamp: Date.now(),
              source: "admin-list",
            },
          })
        );

        toast.success(t("product.deleteSuccess"));
      }
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error(t("product.deleteError"));
    }
  };

  const renderProductGrid = (items: Product[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((product) => (
          <Card key={product._id} className="overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={product.images[0] || "/placeholder-watch.jpg"}
                alt={product.displayNames?.[language] || product.name}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader>
              <h3 className="font-semibold">
                {product.displayNames?.[language] || product.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {product.brand?.displayNames?.[language] ||
                  product.brand?.name ||
                  "N/A"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">${product.price.toLocaleString()}</p>
                  {product.originalPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/editProduct/${product._id}`}>
                    <Button
                      size="icon"
                      variant="outline"
                      title={t("product.admin.actions.edit")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDeleteProduct(product._id, product.name)}
                    title={t("product.admin.actions.delete")}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            {t("product.admin.table.noProducts")}
          </div>
        )}
      </div>
    );
  };

  const renderProductTable = (items: Product[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("product.admin.table.image")}</TableHead>
          <TableHead>{t("product.admin.table.name")}</TableHead>
          <TableHead>{t("product.admin.table.brand")}</TableHead>
          <TableHead>{t("product.admin.table.order")}</TableHead>
          <TableHead>{t("product.admin.table.price")}</TableHead>
          <TableHead>{t("product.price")}</TableHead>
          <TableHead>{t("product.listedDate")}</TableHead>
          <TableHead className="text-right">
            {t("product.admin.table.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items
          .sort((a, b) => a.order - b.order)
          .map((product) => (
            <TableRow key={product._id}>
              <TableCell>
                <div className="relative w-16 h-16">
                  <Image
                    src={product.images[0] || "/placeholder-watch.jpg"}
                    alt={product.displayNames?.[language] || product.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {product.displayNames?.[language] || product.name}
              </TableCell>
              <TableCell>
                {product.brand?.displayNames?.[language] ||
                  product.brand?.name ||
                  "N/A"}
              </TableCell>
              <TableCell>{product.order}</TableCell>
              <TableCell>${product.price.toLocaleString()}</TableCell>
              <TableCell>${product.originalPrice.toLocaleString()}</TableCell>
              <TableCell>
                {new Date(product.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/editProduct/${product._id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      title={t("product.admin.actions.edit")}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProduct(product._id, product.name)}
                    title={t("product.admin.actions.delete")}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-10">
              {t("product.admin.table.noProducts")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
              {t("product.admin.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("product.admin.description")}
            </p>
          </div>
          <div className="flex gap-4">
            {/* Hide toggle button on mobile, show on sm+ */}
            <div className="hidden sm:block">
              <Button
                variant="outline"
                onClick={() =>
                  setViewMode(viewMode === "table" ? "grid" : "table")
                }
              >
                {viewMode === "table"
                  ? t("product.admin.grid.title")
                  : t("product.admin.table.title")}
              </Button>
            </div>
            <Button
              className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
              onClick={() => router.push("/admin/products/create")}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("product.admin.create.title")}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="published" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="published" className="flex-1">
              {t("product.admin.status.active")} ({activeProducts.length})
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex-1">
              {t("product.admin.status.draft")} ({draftProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="published">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  {t("product.admin.status.active")}
                </h2>
              </CardHeader>
              <CardContent>
                {viewMode === "table"
                  ? renderProductTable(activeProducts)
                  : renderProductGrid(activeProducts)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  {t("product.admin.status.draft")}
                </h2>
              </CardHeader>
              <CardContent>
                {viewMode === "table"
                  ? renderProductTable(draftProducts)
                  : renderProductGrid(draftProducts)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
