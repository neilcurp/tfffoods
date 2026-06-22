"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { CldUploadButton } from "next-cloudinary";
import { cachedGet } from "@/utils/services/clientCache";

const GallerySlider = () => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(2);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cachedGet<{ images?: string[] }>("/api/gallery")
      .then((data) => {
        setImages(data?.images || []);
      })
      .catch((error) => {
        console.error("Error fetching gallery:", error);
        setImages([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  const getVisibleImages = () => {
    const visibleIndices = [
      (currentIndex - 2 + images.length) % images.length,
      (currentIndex - 1 + images.length) % images.length,
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex + 2) % images.length,
    ];
    return visibleIndices.map((index) => images[index]);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        prevSlide();
      } else if (event.key === "ArrowRight") {
        nextSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-[30rem]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : images.length > 0 ? (
        <div className="relative w-full max-w-6xl mx-auto sm:py-24 py-14 px-4 overflow-hidden">
          <div className="flex items-center justify-center space-x-4">
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              {getVisibleImages().map((image, index) => (
                <motion.div
                  key={`${image}-${index}`}
                  className={`relative transition-all duration-300 ease-in-out ${
                    index === 2
                      ? "sm:w-[45rem] sm:h-[30rem] w-[25rem] h-[15rem]"
                      : "sm:w-[30rem] sm:h-[20rem] w-[20rem] h-[12rem]"
                  } ${
                    index === 0 || index === 4
                      ? "opacity-50 sm:block hidden"
                      : "opacity-100"
                  }`}
                  custom={direction}
                  variants={index === 1 || index === 3 ? variants : {}}
                  initial={index === 1 || index === 3 ? "enter" : false}
                  animate={index === 1 || index === 3 ? "center" : false}
                  exit={index === 1 || index === 3 ? "exit" : undefined}
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                >
                  <Image
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index === 2}
                    src={image}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                  {index !== 2 && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 p-3 rounded-full shadow-md hover:bg-opacity-75 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 p-3 rounded-full shadow-md hover:bg-opacity-75 transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default GallerySlider;
