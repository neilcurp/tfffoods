import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tag, Star, Box, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/providers/language/LanguageContext";
import { cachedGet } from "@/utils/services/clientCache";
import HeroImageFallback from "@/public/watch1.jpg";

interface Brand {
  _id: string;
  name: string;
  displayNames?: {
    [key: string]: string;
  };
}

interface Category {
  _id: string;
  name: string;
  displayNames?: {
    [key: string]: string;
  };
}

interface Specification {
  key: string;
  value: string | number | boolean | { [key: string]: string };
  type?: string;
  displayNames?: {
    [key: string]: string;
  };
}

interface FeaturedProduct {
  _id: string;
  images: string[];
  name: string;
  displayNames?: {
    [key: string]: string;
  };
  description: string;
  brand: Brand;
  category: Category;
  price: number;
  originalPrice: number;
  averageRating: number;
  numReviews: number;
  specifications?: Specification[];
  descriptions?: { [key: string]: string };
}

const FeaturedProduct = () => {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useTranslation();

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      const data = await cachedGet<FeaturedProduct[]>("/api/products/featured");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching featured products:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const nextProduct = () =>
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
  const prevProduct = () =>
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + products.length) % products.length
    );
  const getProductIndex = (offset: number): number =>
    (currentIndex + offset + products.length) % products.length;

  const renderSpecificationValue = (value: Specification["value"]) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (typeof value === "object" && value !== null) {
      // If it's an object with language keys, return the value for current language
      if ("en" in value || "zh-TW" in value) {
        return value[language] || value["en"] || Object.values(value)[0];
      }
      // If it's some other object, stringify it
      return JSON.stringify(value);
    }
    return value;
  };

  if (isLoading) {
    return (
      <header
        className="relative text-foreground sm:h-[58rem] flex items-center overflow-hidden"
        style={{ backgroundColor: "hsla(var(--background), 0.5)" }}
      >
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="bg-card rounded-lg shadow-2xl overflow-hidden text-foreground animate-pulse">
            <div className="md:flex">
              <div className="w-full md:w-2/5 h-96 bg-gray-200 dark:bg-gray-700"></div>
              <div className="md:w-3/5 p-6 md:p-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-6"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <header
        className="relative text-foreground sm:h-[58rem] flex items-center overflow-hidden"
        style={{ backgroundColor: "hsla(var(--background), 0.5)" }}
      >
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="text-center text-muted-foreground">
            {t("common.noResults")}
          </div>
        </div>
      </header>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <header
      className="relative text-foreground sm:h-[58rem] flex items-center overflow-hidden"
      style={{ backgroundColor: "hsla(var(--background), 0.5)" }}
    >
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold mb-2 text-center text-foreground"
        >
          {t("product.featured")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-md md:text-xl mb-8 text-center text-muted-foreground"
        >
          {t("product.viewAllProducts")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card rounded-lg shadow-2xl overflow-hidden text-foreground"
        >
          <div className="relative">
            <button
              onClick={prevProduct}
              className="absolute left-4 p-1 top-1/2 transform -translate-y-1/2 z-20 bg-background/50 rounded-full shadow-lg hover:bg-background/80 transition-colors"
              type="button"
              aria-label={t("common.previous")}
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
            </button>
            <div className="md:flex">
              <div className="relative group">
                <Image
                  src={currentProduct?.images?.[0] || HeroImageFallback}
                  alt={
                    currentProduct?.displayNames?.[language] ||
                    currentProduct?.name ||
                    t("product.featured")
                  }
                  width={800}
                  height={600}
                  className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 duration-300 group-hover:scale-105 group-hover:opacity-100 transition flex items-center justify-center">
                  <Link
                    href={
                      currentProduct?._id
                        ? `/product/${currentProduct._id}`
                        : "/products"
                    }
                    className="bg-foreground text-background px-6 py-3 rounded-full hover:bg-muted transition duration-300"
                  >
                    {currentProduct?._id
                      ? t("common.viewDetails")
                      : t("product.viewAllProducts")}
                  </Link>
                </div>
              </div>
              <div className="md:w-3/5 p-6 md:p-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-3xl font-bold">
                    {currentProduct?.displayNames?.[language] ||
                      currentProduct?.name}
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6 text-lg">
                  {(
                    currentProduct?.descriptions?.[language] ||
                    currentProduct?.description
                  )?.slice(0, 500) || t("common.noDescription")}
                  {(currentProduct?.descriptions?.[language] ||
                    currentProduct?.description) &&
                    currentProduct?._id && (
                      <>
                        ...{" "}
                        <Link
                          className="text-primary bg-primary/10 px-2 rounded-lg"
                          href={`/product/${currentProduct._id}`}
                        >
                          {t("common.readMore")}
                        </Link>
                      </>
                    )}
                </p>
                <div className="flex items-center mb-6">
                  <span className="text-3xl font-bold text-primary">
                    ${currentProduct?.price?.toLocaleString() || 0}
                  </span>
                  <span className="text-xl text-muted-foreground line-through ml-4">
                    ${currentProduct?.originalPrice?.toLocaleString() || 0}
                  </span>
                  <span className="ml-4 hidden md:block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                    {t("common.save")} $
                    {(
                      (currentProduct?.originalPrice || 0) -
                      (currentProduct?.price || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-muted-foreground">
                      {t("product.brand.label")}:
                    </span>{" "}
                    {currentProduct?.brand?.displayNames?.[language] ||
                      currentProduct?.brand?.name ||
                      "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("product.category.label")}:
                    </span>{" "}
                    {currentProduct?.category?.displayNames?.[language] ||
                      currentProduct?.category?.name ||
                      "N/A"}
                  </div>
                  {currentProduct?.specifications?.map((spec, index) => {
                    // Only show manufactury_country and color specifications
                    if (
                      spec.key === "manufactury_country" ||
                      spec.key === "color"
                    ) {
                      return (
                        <div key={index}>
                          <span className="text-muted-foreground">
                            {t(`product.${spec.key}.label`)}:
                          </span>{" "}
                          {renderSpecificationValue(spec.value)}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-6">
                  <Star className="w-5 h-5 mr-2" />
                  <span className="flex items-center">
                    {currentProduct?.averageRating?.toFixed(1) || "0.0"}
                    <Star className="w-4 h-4 text-yellow-400 ml-1" />
                  </span>
                  <span className="mx-2">|</span>
                  <span>
                    {currentProduct?.numReviews || 0}{" "}
                    {t("review.common.reviews")}
                  </span>
                </div>
                <div className="flex space-x-4">
                  <Link
                    href={
                      currentProduct?._id
                        ? `/product/${currentProduct._id}`
                        : "/products"
                    }
                    className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition duration-300 text-center text-lg font-semibold"
                  >
                    {currentProduct?._id
                      ? t("common.viewDetails")
                      : t("product.viewAllProducts")}
                  </Link>
                </div>
              </div>
            </div>
            <button
              onClick={nextProduct}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-background/50 rounded-full p-1 shadow-lg hover:bg-background/80 transition-colors"
              type="button"
              aria-label={t("common.next")}
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
            </button>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default FeaturedProduct;
