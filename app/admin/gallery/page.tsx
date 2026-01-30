"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CldUploadButton } from "next-cloudinary";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import Image from "next/image";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, FileText } from "lucide-react";
import axios from "axios";

export default function AdminGalleryPage() {
  const [images, setImages] = useState<string[]>([]);
  const [stagedImages, setStagedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation();
  const isAdmin = session?.user?.admin;

  const breadcrumbItems = [
    {
      label: t("navigation.admin"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("admin.gallery.title"),
      href: "/admin/gallery",
      icon: FileText,
    },
  ];

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      router.replace("/admin");
      return;
    }
    axios
      .get("/api/gallery")
      .then((res) => {
        setImages(res.data.images || []);
        setStagedImages(res.data.images || []);
      })
      .catch((error) => {
        console.error("Error fetching gallery:", error);
        toast.error(t("admin.gallery.fetchError"));
      });
  }, [isAdmin, status, router, t]);

  const handleUpload = (result: any) => {
    if (
      result.info &&
      typeof result.info === "object" &&
      "secure_url" in result.info
    ) {
      const url = result.info.secure_url as string;
      setStagedImages((prev) => [...prev, url]);
      toast.success(t("admin.gallery.uploadSuccess"));
    }
  };

  const handleRemove = (e: React.MouseEvent, urlToRemove: string) => {
    e.preventDefault();
    setStagedImages((prev) => prev.filter((url) => url !== urlToRemove));
    toast.success(t("admin.gallery.removeSuccess"));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put("/api/gallery", { images: stagedImages });
      setImages(stagedImages);
      toast.success(t("admin.gallery.saveSuccess"));
    } catch (error) {
      console.error("Error saving gallery:", error);
      toast.error(t("admin.gallery.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(stagedImages);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setStagedImages(reordered);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return <div>Unauthorized</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <div className="mb-8">
        <div className="bg-card rounded-lg shadow-sm p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
            {t("admin.gallery.title")}
          </h1>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === "en" ? "Gallery Images" : "畫廊圖片"}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stagedImages.map((url, index) => (
              <div key={index} className="relative group">
                <Image
                  src={url}
                  alt={`${language === "en" ? "Gallery image" : "畫廊圖片"} ${
                    index + 1
                  }`}
                  width={200}
                  height={200}
                  className="rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, url)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            <CldUploadButton
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
              onSuccess={handleUpload}
              options={{
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                maxFiles: 10,
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

        <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition disabled:opacity-50"
            disabled={loading || images === stagedImages}
          >
            {loading ? t("common.saving") : t("admin.gallery.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
