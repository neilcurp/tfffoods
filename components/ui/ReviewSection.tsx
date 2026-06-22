"use client";
import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import { CldUploadButton } from "next-cloudinary";
import useSWR, { mutate } from "swr";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useConfirm } from "@/components/ui/confirm-provider";
import type { Review as GlobalReview } from "@/types";

// Local review type that extends the global one with UI-specific fields
interface ReviewWithUI extends GlobalReview {
  user: {
    name: string;
    image?: string;
    profileImage?: string;
    email: string;
    _id: string;
  };
  image?: string;
}

interface Props {
  productId: string;
  averageRating: number;
  allReviews: GlobalReview[];
  setAllReviews: (reviews: GlobalReview[]) => void;
  setAverageRating: (avg: number) => void;
}

const ReviewSection = ({
  productId,
  averageRating,
  allReviews,
  setAllReviews,
  setAverageRating,
}: Props) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    image: "",
  });
  const { data: session } = useSession();

  // Helper to recalculate average
  const recalculateAverage = (reviews: GlobalReview[]) => {
    if (!reviews.length) return 0;
    return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error(t("review.messages.loginRequired"));
      return;
    }

    let data;
    try {
      const response = await axios.post(`/api/review`, {
        ...newReview,
        productId,
      });
      data = response.data;
    } catch (err: any) {
      if (
        err.response &&
        err.response.data &&
        err.response.data.error === "you have already reviewed this"
      ) {
        toast.error(t("review.messages.alreadyReviewed"));
        setNewReview({ rating: 5, comment: "", image: "" });
      } else {
        toast.error(t("review.messages.submitError"));
        setNewReview({ rating: 5, comment: "", image: "" });
      }
      return;
    }
    // Only update UI and show success toast if API call succeeded
    const updatedReviews = [...allReviews, data.review] as GlobalReview[];
    setAllReviews(updatedReviews);
    setAverageRating(recalculateAverage(updatedReviews));
    setNewReview({ rating: 5, comment: "", image: "" });
    toast.success(t("review.messages.submitSuccess"));
    mutate("/api/products");
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = await confirm({
      title: t("review.messages.deleteConfirmTitle"),
      description: t("review.messages.deleteConfirm"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;

    let success = false;
    try {
      await axios.delete(`/api/review?reviewId=${reviewId}`);
      success = true;
    } catch (err) {
      toast.error(t("review.messages.deleteError"));
      return;
    }
    // Only update UI and show success toast if API call succeeded
    const updatedReviews = allReviews.filter((r) => r._id !== reviewId);
    setAllReviews(updatedReviews);
    setAverageRating(recalculateAverage(updatedReviews));
    toast.success(t("review.messages.deleteSuccess"));
    mutate("/api/products");
  };

  // Cast allReviews to ReviewWithUI[] for UI rendering
  const reviewsWithUI = allReviews as unknown as ReviewWithUI[];

  return (
    <section
      className="py-4 mt-2 rounded-lg overflow-hidden relative transition-all duration-300 dark:shadow-[0_10px_15px_-3px_rgba(255,255,255,0.1),0_4px_6px_-2px_rgba(255,255,255,0.05)] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:dark:shadow-[0_20px_25px_-5px_rgba(255,255,255,0.1),0_10px_10px_-5px_rgba(255,255,255,0.04)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]"
      style={{ backgroundColor: "hsla(var(--card), var(--card-opacity, 1))" }}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-center mb-4 text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white transition-colors">
          {t("review.common.reviews")}
        </h2>
        <div className="text-center mb-8 transform hover:scale-105 transition-transform duration-300">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {averageRating.toFixed(1)} / 5.0
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {t("review.common.basedOn", { count: allReviews.length })}
          </div>
        </div>

        {/* Review Form */}
        {session && (
          <form
            onSubmit={handleSubmitReview}
            className="max-w-m mx-auto mb-12 transition-transform duration-300 hover:scale-[1.01]"
          >
            <div
              className="p-4 rounded-lg transition-all duration-300 dark:shadow-[0_10px_15px_-3px_rgba(255,255,255,0.1),0_4px_6px_-2px_rgba(255,255,255,0.05)] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:dark:shadow-[0_20px_25px_-5px_rgba(255,255,255,0.1),0_10px_10px_-5px_rgba(255,255,255,0.04)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]"
              style={{
                backgroundColor: "hsla(var(--card), var(--card-opacity, 0.8))",
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 hover:text-gray-800 dark:hover:text-white transition-colors">
                  {t("review.form.rating")}
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setNewReview({ ...newReview, rating: star })
                      }
                      className="focus:outline-none transform hover:scale-110 transition-transform duration-200"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors duration-200 ${
                          star <= newReview.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 hover:text-gray-800 dark:hover:text-white transition-colors">
                  {t("review.form.comment")}
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={4}
                  required
                  placeholder={t("review.placeholders.comment")}
                ></textarea>
              </div>
              <div className="mb-4 flex items-center gap-3 mt-2">
                <CldUploadButton
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={(result: any) => {
                    const url = result.info.secure_url;
                    setNewReview((prev) => ({ ...prev, image: url }));
                    toast.success(t("review.media.imageUploadSuccess"));
                  }}
                  options={{
                    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                    maxFiles: 1,
                    sources: ["local", "url", "camera"],
                    clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                    maxFileSize: 10000000,
                    multiple: false,
                  }}
                >
                  <div
                    className="w-28 h-10 flex items-center justify-center rounded-lg border border-dashed transition cursor-pointer"
                    style={{
                      backgroundColor:
                        "hsla(var(--card), var(--card-opacity, 0.4))",
                    }}
                  >
                    <span className="text-gray-500 dark:text-gray-300 text-xs">
                      {t("review.form.photos")}
                    </span>
                  </div>
                </CldUploadButton>
                {newReview.image && (
                  <div className="relative">
                    <Image
                      src={newReview.image}
                      alt={t("review.media.imagePreview")}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewReview((prev) => ({ ...prev, image: "" }))
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-600"
                      title={t("common.remove")}
                    >
                      ✕
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                >
                  {t("review.form.submit")}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 max-w-xl mx-auto sm:px-4">
          {reviewsWithUI
            .filter((r) => r?.user)
            .map((review) => (
              <div
                key={review._id}
                className="p-6 rounded-lg transition-all duration-300 hover:-translate-y-1 dark:shadow-[0_10px_15px_-3px_rgba(255,255,255,0.1),0_4px_6px_-2px_rgba(255,255,255,0.05)] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:dark:shadow-[0_20px_25px_-5px_rgba(255,255,255,0.1),0_10px_10px_-5px_rgba(255,255,255,0.04)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]"
                style={{
                  backgroundColor:
                    "hsla(var(--card), var(--card-opacity, 0.8))",
                }}
              >
                <div className="flex items-center mb-4 gap-3">
                  <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-200">
                    <Image
                      src={
                        review.user.profileImage ||
                        review.user.image ||
                        "/profile.jpg"
                      }
                      alt={review.user.name || t("common.user")}
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-gray-100 dark:ring-gray-700 hover:ring-gray-200 dark:hover:ring-gray-600 transition-all"
                    />
                  </div>
                  <div className="ml-4 flex-grow">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      {review.user.name}
                    </h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 transition-colors duration-200 ${
                            i < review.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {session?.user?.name === review.user.name && (
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                      title={t("review.common.deleteReview")}
                    >
                      {t("common.delete")}
                    </button>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.image && (
                  <div className="mb-2 flex justify-center">
                    <Image
                      src={review.image}
                      alt={t("review.media.reviewImage")}
                      width={160}
                      height={160}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 transition-colors leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          {reviewsWithUI.filter((r) => r?.user).length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-8 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {t("review.common.noReviews")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
