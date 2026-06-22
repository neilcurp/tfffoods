import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/providers/language/LanguageContext";
import { cachedGet } from "@/utils/services/clientCache";
import * as LucideIcons from "lucide-react";

interface ProductOfTheMonth {
  _id: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  productOfTheMonthDetails: {
    description: {
      en: string;
      "zh-TW": string;
    };
    features: Array<{
      icon: string;
      title: {
        en: string;
        "zh-TW": string;
      };
      description: {
        en: string;
        "zh-TW": string;
      };
    }>;
  };
  images: string[];
  brand: {
    _id: string;
    name: string;
    displayNames: {
      en: string;
      "zh-TW": string;
    };
  };
}

const renderIcon = (icon: string) => {
  if (!icon) return null;
  // Inline SVG
  if (/^<svg[\s\S]*<\/svg>$/.test(icon.trim())) {
    const svg = icon
      .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
      .replace(/fill="[^"]*"/g, 'fill="none"');
    return (
      <span
        className="w-8 h-8 text-yellow-500"
        style={{ display: "inline-block" }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  // Image URL
  if (/^(https?:\/\/|\/)/.test(icon)) {
    return (
      <Image
        src={icon}
        alt="icon"
        width={32}
        height={32}
        className="object-contain"
      />
    );
  }
  // Lucide icon
  const LucideIcon = (LucideIcons as any)[icon];
  if (LucideIcon) {
    return (
      <LucideIcon
        className="w-8 h-8 text-yellow-500"
        color="currentColor"
        fill="currentColor"
      />
    );
  }
  // Emoji/text
  return <span className="text-3xl text-yellow-500">{icon}</span>;
};

const ProductOfTheMonth = () => {
  const [product, setProduct] = useState<ProductOfTheMonth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useTranslation();

  useEffect(() => {
    const fetchProductOfTheMonth = async () => {
      try {
        setIsLoading(true);
        const { data, status } = await cachedGet<{
          data: ProductOfTheMonth | null;
          status: string;
        }>("/api/products/product-of-the-month");

        if (status === "success") {
          setProduct(data); // data will be null if no product is set
        }
      } catch (error) {
        console.error("Error fetching product of the month:", error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductOfTheMonth();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-muted/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto mb-8"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    !product ||
    !product.productOfTheMonthDetails ||
    !product.productOfTheMonthDetails.description
  ) {
    return null;
  }

  const description =
    product.productOfTheMonthDetails.description[language] ||
    product.productOfTheMonthDetails.description.en ||
    "";
  const features = product.productOfTheMonthDetails.features || [];

  return (
    <div className="bg-muted/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h2
          className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-8 md:mb-12 text-foreground"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {product.displayNames?.[language] || product.displayNames?.en || ""}
        </motion.h2>
        <motion.h3
          className="text-lg md:text-xl font-medium text-muted-foreground mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {t("product.productOfTheMonth.title")}
        </motion.h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            className="flex justify-center space-x-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Image
              src={product.images?.[0] || ""}
              alt={
                product.displayNames?.[language] ||
                product.displayNames?.en ||
                ""
              }
              width={500}
              height={200}
              className="rounded-lg shadow-lg hover:shadow-2xl"
            />
          </motion.div>

          <motion.div
            className="lg:text-left text-center lg:pr-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <p className="text-lg text-muted-foreground mb-8">{description}</p>
            <Link
              href={
                product.brand?._id
                  ? `/products/brand/${product.brand._id}`
                  : "#"
              }
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition duration-300"
            >
              {t("product.productOfTheMonth.viewProduct")}
            </Link>
          </motion.div>
        </div>

        <hr className="my-16 border-border" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 + index * 0.2 }}
            >
              <div className="text-4xl mb-4">{renderIcon(feature.icon)}</div>
              <h4 className="font-semibold text-xl mb-2 text-foreground">
                {feature.title?.[language] || feature.title?.en || ""}
              </h4>
              <p className="text-muted-foreground">
                {feature.description?.[language] ||
                  feature.description?.en ||
                  ""}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductOfTheMonth;
