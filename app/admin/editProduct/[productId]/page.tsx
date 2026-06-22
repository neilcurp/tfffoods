"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  CldUploadButton,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Specification } from "@/types";
import { MultiLangInput } from "@/components/MultiLangInput";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { mutate } from "swr";

interface Brand {
  _id: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
}

interface Category {
  _id: string;
  name: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  description?: string;
  specifications?: Array<{
    label: string;
    key: string;
    type: "text" | "number" | "select";
    options?: {
      en: string[];
      "zh-TW": string[];
      prices?: number[];
    };
    required: boolean;
    displayNames: {
      en: string;
      "zh-TW": string;
    };
    description?: string;
  }>;
}

interface ProductData {
  user?: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  description: string;
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  brand: string | Brand;
  images: string[];
  price: number;
  netPrice: number;
  originalPrice: number;
  stock: number;
  category: string | Category;
  specifications: Array<{
    key: string;
    value: {
      en: string;
      "zh-TW": string;
    };
    type: "text" | "number" | "select";
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
    description?: string;
    options?: {
      en: string[];
      "zh-TW": string[];
      prices?: number[];
    };
    required?: boolean;
    selectedOptionPrice?: number;
  }>;
  draft: boolean;
  isBestSelling: boolean;
  order: number;
}

interface Props {
  params: {
    productId: string;
  };
}

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  asset_id: string;
  folder: string;
  type: string;
  id?: string;
  original_filename?: string;
  path?: string;
  thumbnail_url?: string;
  api_key?: string;
  batchId?: string;
  etag?: string;
  hook_execution?: string;
  delete_token?: string;
  access_mode?: string;
  url?: string;
  created_at?: string;
  bytes?: number;
  width?: number;
  height?: number;
  resource_type?: string;
  format?: string;
  version?: string;
  signature?: string;
  public_id?: string;
  [key: string]: any;
}

interface CustomUploadResult {
  event: string;
  info: {
    secure_url: string;
  };
}

const EditProduct = () => {
  const params = useParams();
  const productId = params?.productId as string;
  console.log("Edit Product params:", params);
  console.log("Product ID:", productId);

  const { data: session, status } = useSession();
  const router = useRouter();
  const { language, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [product, setProduct] = useState<ProductData>({
    user: session?.user?.id,
    name: "",
    displayNames: {
      en: "",
      "zh-TW": "",
    },
    description: "",
    descriptions: {
      en: "",
      "zh-TW": "",
    },
    brand: "",
    images: [],
    price: 0,
    netPrice: 0,
    originalPrice: 0,
    stock: 0,
    category: "",
    specifications: [],
    draft: false,
    isBestSelling: false,
    order: 0,
  });

  // Fetch categories, brands and product data
  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        console.error("No product ID provided");
        toast.error(language === "en" ? "Product not found" : "找不到產品");
        router.push("/admin/products");
        return;
      }

      try {
        setIsLoading(true);
        console.log("Fetching data for product:", productId);

        // First fetch categories and brands
        const [categoriesRes, brandsRes] = await Promise.all([
          axios.get("/api/categories"),
          axios.get("/api/brands"),
        ]);

        console.log("Categories Response:", categoriesRes.data);
        console.log("Brands Response:", brandsRes.data);

        if (Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data);
        } else {
          toast.error(
            language === "en"
              ? "Invalid category data received"
              : "收到無效的類別數據"
          );
        }

        if (Array.isArray(brandsRes.data)) {
          setBrands(brandsRes.data);
        } else {
          toast.error(
            language === "en"
              ? "Invalid brand data received"
              : "收到無效的品牌數據"
          );
        }

        // Then fetch product data
        console.log("Fetching product data for ID:", productId);
        const productRes = await axios.get(`/api/products/manage/${productId}`);
        console.log("Product Response:", productRes.data);

        // The product data is directly in productRes.data
        if (productRes.data) {
          const productData = productRes.data;
          setImageUrls(productData.images || []);

          // Find and set the selected category
          const category = categoriesRes.data.find(
            (c: Category) =>
              c._id === (productData.category?._id || productData.category)
          );
          console.log("Found Category:", category);
          console.log("Product Category:", productData.category);
          setSelectedCategory(category || null);

          // Set the product data with all values in a single update
          const updatedProduct = {
            ...productData,
            brand: productData.brand._id || productData.brand,
            category: productData.category._id || productData.category,
          };
          console.log("Setting product with data:", updatedProduct);
          setProduct(updatedProduct);
        } else {
          toast.error(language === "en" ? "Product not found" : "找不到產品");
          router.push("/admin/products");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error instanceof AxiosError) {
          if (error.response?.status === 404) {
            toast.error(language === "en" ? "Product not found" : "找不到產品");
            router.push("/admin/products");
          } else {
            toast.error(
              error.response?.data?.error ||
                (language === "en" ? "Failed to load data" : "加載數據失敗")
            );
          }
        } else {
          toast.error(
            language === "en" ? "Failed to load data" : "加載數據失敗"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.admin) {
      fetchData();
    }
  }, [session, productId, router, language]);

  // Redirect if not admin
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.admin) {
      toast.error("Unauthorized: Admin access required");
      router.push("/");
    }
  }, [session, status, router]);

  // Show loading or unauthorized for non-admins
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === "authenticated" && !session?.user?.admin) {
    return null; // Will redirect in useEffect
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "category") {
      console.log("Category changed to:", value);
      const category = categories.find((c) => c._id === value);
      console.log("Found category:", category);
      setSelectedCategory(category || null);

      // Initialize specifications when category changes
      const initialSpecs =
        category?.specifications?.map((spec) => ({
          key: spec.key || spec.label.toLowerCase().replace(/\s+/g, "_"),
          value: {
            en: "",
            "zh-TW": "",
          },
          type: spec.type,
          displayNames: {
            en: spec.displayNames?.en || spec.label,
            "zh-TW": spec.displayNames?.["zh-TW"] || spec.label,
          },
          options:
            spec.type === "select"
              ? {
                  en: spec.options?.en || [],
                  "zh-TW": spec.options?.["zh-TW"] || [],
                  prices:
                    spec.options?.prices ||
                    Array(spec.options?.en?.length || 0).fill(0),
                }
              : undefined,
          required: spec.required || false,
        })) || [];

      setProduct((prev) => {
        const updated = {
          ...prev,
          category: value,
          specifications: initialSpecs,
        };
        console.log("Updating product with:", updated);
        return updated;
      });
    } else {
      setProduct((prev) => ({
        ...prev,
        [name]:
          name === "price" ||
          name === "netPrice" ||
          name === "originalPrice" ||
          name === "stock" ||
          name === "order"
            ? Number(value)
            : value,
      }));
    }
  };

  const handleSpecificationChange = (
    key: string,
    value: string | number | { en: string; "zh-TW": string },
    optionPrice?: number,
    newOptions?: {
      en: string[];
      "zh-TW": string[];
      prices?: number[];
    }
  ) => {
    if (!key) return;

    setProduct((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec) => {
        if (spec.key !== key) return spec;

        // Handle the value based on the specification type
        let processedValue: { en: string; "zh-TW": string };
        if (typeof value === "object" && "en" in value && "zh-TW" in value) {
          // If it's already in the correct format, use it directly
          processedValue = value as { en: string; "zh-TW": string };
        } else if (spec.type === "number") {
          // For numbers, use the same value for both languages
          const numValue = String(value);
          processedValue = {
            en: numValue,
            "zh-TW": numValue,
          };
        } else if (spec.type === "select") {
          // For select, use the selected option for both languages
          const strValue = String(value);
          processedValue = {
            en: strValue,
            "zh-TW": strValue,
          };
        } else {
          // For text and other types, keep existing values and update only the changed one
          const currentValue = spec.value as { en: string; "zh-TW": string };
          processedValue = {
            ...currentValue,
            [typeof value === "string" ? "en" : Object.keys(value)[0]]:
              typeof value === "string" ? value : Object.values(value)[0],
          };
        }

        return {
          ...spec,
          value: processedValue,
          selectedOptionPrice: optionPrice,
          options: newOptions || spec.options,
        };
      }),
    }));
  };

  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    console.log("Upload result:", result);
    if (
      result?.event === "success" &&
      typeof result.info === "object" &&
      "secure_url" in result.info
    ) {
      const newUrl = result.info.secure_url as string;
      if (!imageUrls.includes(newUrl)) {
        setImageUrls((prevUrls) => [...prevUrls, newUrl]);
        setProduct((prev) => ({
          ...prev,
          images: [...prev.images, newUrl],
        }));
        toast.success("Image uploaded successfully");
      }
    } else if (result?.event === "error" || result?.event === "abort") {
      toast.error("Failed to upload image. Please try again.");
      console.error("Upload error:", result);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent, urlToRemove: string) => {
    e.preventDefault();
    setImageUrls((prevUrls) => prevUrls.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!session?.user?.id) {
      toast.error("User ID not found");
      setIsLoading(false);
      return;
    }

    if (imageUrls.length === 0) {
      toast.error("Please upload at least one image");
      setIsLoading(false);
      return;
    }

    if (!product.category) {
      toast.error("Please select a category");
      setIsLoading(false);
      return;
    }

    if (!product.brand) {
      toast.error("Please select a brand");
      setIsLoading(false);
      return;
    }

    if (!product.displayNames.en || !product.displayNames["zh-TW"]) {
      toast.error(
        language === "en" ? "Product name cannot be empty" : "產品名稱不能為空"
      );
      setIsLoading(false);
      return;
    }

    if (!product.descriptions.en || !product.descriptions["zh-TW"]) {
      toast.error(
        language === "en"
          ? "Product description cannot be empty"
          : "產品描述不能為空"
      );
      setIsLoading(false);
      return;
    }

    // Check required specifications
    const missingSpecs = product.specifications.filter((spec) => {
      if (!spec.required) return false;
      if (!spec.value) return true;
      if (spec.type === "text") {
        const value = spec.value as { en: string; "zh-TW": string };
        return !value.en || !value["zh-TW"];
      }
      return false;
    });

    if (missingSpecs.length > 0) {
      toast.error(
        `Please fill in required specifications: ${missingSpecs
          .map((spec) => spec.displayNames?.[language] || spec.key)
          .join(", ")}`
      );
      setIsLoading(false);
      return;
    }

    try {
      // Process specifications to ensure proper format for saving
      const processedSpecs = product.specifications.map((spec) => {
        // Ensure value is always an object with en and zh-TW
        let value = {
          en: "",
          "zh-TW": "",
        };

        if (typeof spec.value === "object") {
          if ("en" in spec.value && "zh-TW" in spec.value) {
            // If it's already in the correct format
            value = spec.value;
          } else {
            // If it's some other object, try to convert it
            value = {
              en: String(Object.values(spec.value)[0] || ""),
              "zh-TW": String(Object.values(spec.value)[0] || ""),
            };
          }
        } else {
          // If it's a primitive value, use it for both languages
          value = {
            en: String(spec.value || ""),
            "zh-TW": String(spec.value || ""),
          };
        }

        return {
          key: spec.key,
          value: value,
          type: spec.type || "text",
          displayNames: spec.displayNames || {
            en: spec.key,
            "zh-TW": spec.key,
          },
          options: spec.type === "select" ? spec.options : undefined,
          required: spec.required || false,
        };
      });

      // Ensure all required fields are present and properly formatted
      const productData = {
        user: session.user.id,
        name: product.displayNames.en,
        displayNames: product.displayNames,
        description: product.descriptions.en,
        descriptions: product.descriptions,
        brand:
          typeof product.brand === "object" ? product.brand._id : product.brand,
        category:
          typeof product.category === "object"
            ? product.category._id
            : product.category,
        images: imageUrls,
        price: Number(product.price),
        netPrice: Number(product.netPrice),
        originalPrice: Number(product.originalPrice),
        stock: Number(product.stock),
        specifications: processedSpecs,
        draft: product.draft,
        isBestSelling: product.isBestSelling,
        order: Number(product.order),
      };

      console.log("Submitting product data:", productData);

      const response = await axios.put(
        `/api/products/manage/${productId}`,
        productData
      );

      if (response.data) {
        // Only dispatch event on client side
        if (typeof window !== "undefined") {
          const event = new CustomEvent("product:updated", {
            detail: {
              productId,
              timestamp: Date.now(),
              updates: {
                stock: Number(product.stock), // Add explicit stock update
              },
            },
          });
          window.dispatchEvent(event);
        }

        // Force immediate cache invalidation with new data
        await Promise.all([
          mutate(
            `/api/products?includeDrafts=true&limit=100&language=${language}`,
            (oldData: any) => {
              if (!oldData?.products) return oldData;
              return {
                ...oldData,
                products: oldData.products.map((p: any) =>
                  p._id === productId ? { ...p, ...productData } : p
                ),
              };
            },
            { revalidate: true }
          ),
          mutate(
            `/api/product/${productId}?language=${language}`,
            { product: { ...response.data, stock: Number(product.stock) } },
            { revalidate: true }
          ),
          mutate(
            `/api/products/manage/${productId}`,
            { ...response.data, stock: Number(product.stock) },
            { revalidate: true }
          ),
        ]);

        toast.success(t("product.updateSuccess"));

        // Navigate after cache invalidation
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || t("product.updateError"));
      } else {
        toast.error(t("product.updateError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">
        {language === "en" ? "Edit Product" : "編輯產品"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-card rounded-lg p-8 border border-[color:var(--card-border)]"
      >
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <MultiLangInput
              label={language === "en" ? "Product Name" : "產品名稱"}
              value={product.displayNames}
              onChange={(value) =>
                setProduct((prev) => ({
                  ...prev,
                  displayNames: value,
                  name: value.en, // Keep the name field in sync with English displayName
                }))
              }
              placeholder={{
                en: "Enter product name in English",
                "zh-TW": "輸入產品中文名稱",
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "en" ? "Brand" : "品牌"}
            </label>
            <select
              name="brand"
              value={
                typeof product.brand === "object"
                  ? product.brand._id
                  : product.brand
              }
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">
                {language === "en" ? "Select a brand" : "選擇品牌"}
              </option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.displayNames[language] || brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "en" ? "Category" : "類別"}
            </label>
            <select
              name="category"
              value={
                typeof product.category === "object"
                  ? product.category._id
                  : product.category
              }
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">
                {language === "en" ? "Select a category" : "選擇類別"}
              </option>
              {categories.map((category) => {
                const currentCategoryId =
                  typeof product.category === "object"
                    ? product.category._id
                    : product.category;
                console.log("Rendering category option:", {
                  id: category._id,
                  name: category.name,
                  selected: category._id === currentCategoryId,
                });
                return (
                  <option key={category._id} value={category._id}>
                    {category.displayNames?.[language] || category.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <MultiLangInput
              label={language === "en" ? "Description" : "描述"}
              type="textarea"
              value={product.descriptions}
              onChange={(value) =>
                setProduct((prev) => ({
                  ...prev,
                  descriptions: value,
                  description: value.en, // Keep the description field in sync with English description
                }))
              }
              placeholder={{
                en: "Enter product description in English",
                "zh-TW": "輸入產品中文描述",
              }}
            />
          </div>

          {selectedCategory?.specifications &&
            selectedCategory.specifications.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">
                  {language === "en" ? "Specifications" : "規格"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedCategory.specifications.map((spec) => (
                    <div
                      key={
                        spec.key ||
                        spec.label.toLowerCase().replace(/\s+/g, "_")
                      }
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium">
                        {spec.displayNames?.[language] || spec.label}
                        {spec.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {spec.type === "select" ? (
                        <div className="space-y-4">
                          <select
                            value={String(
                              product.specifications.find(
                                (s) =>
                                  s.key ===
                                  (spec.key ||
                                    spec.label
                                      .toLowerCase()
                                      .replace(/\s+/g, "_"))
                              )?.value?.[language as "en" | "zh-TW"] || ""
                            )}
                            onChange={(e) => {
                              const optionIndex = (
                                spec.options?.en || []
                              ).indexOf(e.target.value);
                              handleSpecificationChange(
                                spec.key ||
                                  spec.label.toLowerCase().replace(/\s+/g, "_"),
                                {
                                  en: e.target.value,
                                  "zh-TW":
                                    spec.options?.["zh-TW"]?.[optionIndex] ||
                                    e.target.value,
                                }
                              );
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required={spec.required}
                          >
                            <option value="">--</option>
                            {(
                              spec.options?.[language as "en" | "zh-TW"] || []
                            ).map((option: string, optionIndex: number) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {spec.options?.en && spec.options.en.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Option Prices
                              </label>
                              <div className="grid gap-2">
                                {spec.options.en.map(
                                  (option: string, optionIndex: number) => (
                                    <div
                                      key={optionIndex}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="flex-1">{option}</span>
                                      <span className="text-sm text-muted-foreground">
                                        $
                                        {(
                                          spec.options?.prices?.[optionIndex] ||
                                          0
                                        ).toFixed(2)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : spec.type === "number" ? (
                        <Input
                          type="number"
                          value={String(
                            product.specifications.find(
                              (s) =>
                                s.key ===
                                (spec.key ||
                                  spec.label.toLowerCase().replace(/\s+/g, "_"))
                            )?.value?.en || ""
                          )}
                          onChange={(e) =>
                            handleSpecificationChange(
                              spec.key ||
                                spec.label.toLowerCase().replace(/\s+/g, "_"),
                              Number(e.target.value)
                            )
                          }
                          onFocus={(e) => e.target.select()}
                          placeholder={
                            language === "en"
                              ? `Enter ${spec.displayNames?.en || spec.label}`
                              : `輸入${
                                  spec.displayNames?.["zh-TW"] || spec.label
                                }`
                          }
                          required={spec.required}
                        />
                      ) : (
                        <MultiLangInput
                          value={
                            (product.specifications.find(
                              (s) =>
                                s.key ===
                                (spec.key ||
                                  spec.label.toLowerCase().replace(/\s+/g, "_"))
                            )?.value as { en: string; "zh-TW": string }) || {
                              en: "",
                              "zh-TW": "",
                            }
                          }
                          onChange={(value) =>
                            handleSpecificationChange(
                              spec.key ||
                                spec.label.toLowerCase().replace(/\s+/g, "_"),
                              value
                            )
                          }
                          placeholder={{
                            en: `Enter ${spec.displayNames?.en || spec.label}`,
                            "zh-TW": `輸入${
                              spec.displayNames?.["zh-TW"] || spec.label
                            }`,
                          }}
                          required={spec.required}
                        />
                      )}
                      {spec.description && (
                        <p className="text-sm text-muted-foreground">
                          {spec.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "en" ? "Product Images" : "產品圖片"}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <Image
                    src={url}
                    alt={`Product image ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    onClick={(e) => handleRemoveImage(e, url)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <CldUploadButton
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                onSuccess={handleUpload}
                options={{
                  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                  maxFiles: 5,
                  sources: ["local", "url", "camera"],
                  clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                  maxFileSize: 10000000,
                  multiple: true,
                }}
              >
                <div className="flex items-center justify-center w-full h-32 border border-dashed rounded-lg cursor-pointer">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      {language === "en"
                        ? "Click to upload or drag and drop"
                        : "點擊上傳或拖放"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === "en"
                        ? "PNG, JPG, JPEG or WEBP (MAX. 10MB)"
                        : "PNG、JPG、JPEG 或 WEBP（最大 10MB）"}
                    </p>
                  </div>
                </div>
              </CldUploadButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "en" ? "Net Price" : "淨價"}
              </label>
              <Input
                type="number"
                name="netPrice"
                value={product.netPrice}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "en" ? "Price" : "售價"}
              </label>
              <Input
                type="number"
                name="price"
                value={product.price}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "en" ? "Original Price" : "原價"}
              </label>
              <Input
                type="number"
                name="originalPrice"
                value={product.originalPrice}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "en" ? "Stock" : "庫存"}
              </label>
              <Input
                type="number"
                name="stock"
                value={product.stock}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "en" ? "Display Order" : "顯示順序"}
              </label>
              <Input
                type="number"
                name="order"
                value={product.order}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                required
                placeholder={
                  language === "en" ? "Enter display order" : "輸入顯示順序"
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <Switch
              id="draft-mode"
              checked={product.draft}
              onCheckedChange={(checked) =>
                setProduct((prev) => ({ ...prev, draft: checked }))
              }
            />
            <Label htmlFor="draft-mode">
              {language === "en" ? "Draft Mode" : "草稿模式"}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isBestSelling"
              checked={product.isBestSelling}
              onCheckedChange={(checked) =>
                setProduct((prev) => ({ ...prev, isBestSelling: checked }))
              }
            />
            <Label htmlFor="isBestSelling">
              {language === "en" ? "Best Selling Product" : "暢銷產品"}
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isLoading}
          >
            {isLoading
              ? language === "en"
                ? "Updating..."
                : "更新中..."
              : language === "en"
              ? "Update Product"
              : "更新產品"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
