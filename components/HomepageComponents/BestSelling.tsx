import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/providers/language/LanguageContext";
import { cachedGet } from "@/utils/services/clientCache";

interface Product {
  id: string;
  displayNames: {
    en: string;
    "zh-TW": string;
    [key: string]: string;
  };
  price: number;
  rating: number;
  image: string;
  link: string;
}

const BestSellingProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useTranslation();

  useEffect(() => {
    const fetchBestSellingProducts = async () => {
      try {
        setIsLoading(true);
        const data = await cachedGet<Product[]>("/api/products/bestselling");
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching best-selling products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestSellingProducts();
  }, []);

  const nextProduct = () =>
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
  const prevProduct = () =>
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + products.length) % products.length
    );
  const getProductIndex = (offset: number): number =>
    (currentIndex + offset + products.length) % products.length;

  if (isLoading) {
    return (
      <section className="py-8 md:py-16 app-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-64 h-80 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <section className="py-8 md:py-16 app-background">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-8 md:mb-12 text-foreground">
            {t("common.bestSellingProducts")}
          </h2>
          <div className="text-center text-muted-foreground">
            {t("common.noResults")}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-16 app-background">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-8 md:mb-12 text-foreground">
          {t("common.bestSellingProducts")}
        </h2>
        <div className="relative">
          <button
            onClick={prevProduct}
            className="absolute left-4 p-1 top-1/2 transform -translate-y-1/2 z-10 bg-background/50 rounded-full shadow-lg hover:bg-background/80 transition-colors"
            type="button"
            aria-label="Previous watch"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
          </button>
          <div
            className="flex items-center sm:h-[27rem] h-[40rem] justify-center overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile: Show only one product */}
            <div className="block md:hidden w-full max-w-md mx-auto">
              {products.length > 0 && (
                <Link
                  href={products[currentIndex].link}
                  className="bg-card rounded-[1.5rem] shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full aspect-square relative overflow-hidden">
                    <Image
                      src={products[currentIndex].image}
                      alt={
                        products[currentIndex].displayNames[language] ||
                        products[currentIndex].displayNames.en
                      }
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="p-4 bg-card">
                    <h3 className="text-lg md:text-xl font-semibold mb-1 truncate text-foreground">
                      {products[currentIndex].displayNames[language] ||
                        products[currentIndex].displayNames.en}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">
                        ${products[currentIndex].price}
                      </span>
                      {typeof products[currentIndex].rating === "number" && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 md:w-5 md:h-5 text-primary fill-current" />
                          <span className="ml-1 text-sm md:text-base text-muted-foreground">
                            {products[currentIndex].rating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )}
            </div>
            {/* Desktop: Show multiple products */}
            <div className="hidden md:flex w-full justify-center">
              {Array.from({ length: products.length }).map((_, offset) => {
                const product = products[getProductIndex(offset)];
                if (!product) return null;
                return (
                  <div
                    key={product.id}
                    className={`transition-all duration-300 flex-shrink-0 w-full md:w-1/3 lg:w-1/5 px-2 ${
                      offset === Math.floor(products.length / 2)
                        ? "scale-105 z-10"
                        : "scale-95 opacity-75"
                    }`}
                  >
                    <Link
                      href={product.link}
                      className="bg-card rounded-[1.5rem] shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-full relative overflow-hidden">
                        <Image
                          width={500}
                          height={500}
                          src={product.image}
                          alt={
                            product.displayNames[language] ||
                            product.displayNames.en
                          }
                          className="w-full sm:h-48 md:h-56 lg:h-64 object-cover"
                          priority={offset === Math.floor(products.length / 2)}
                        />
                      </div>
                      <div className="p-4 bg-card">
                        <h3 className="text-lg md:text-xl font-semibold mb-1 truncate text-foreground">
                          {product.displayNames[language] ||
                            product.displayNames.en}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">
                            ${product.price}
                          </span>
                          {typeof product.rating === "number" && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 md:w-5 md:h-5 text-primary fill-current" />
                              <span className="ml-1 text-sm md:text-base text-muted-foreground">
                                {product.rating}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={nextProduct}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-background/50 rounded-full p-1 shadow-lg hover:bg-background/80 transition-colors"
            type="button"
            aria-label="Next watch"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BestSellingProducts;
