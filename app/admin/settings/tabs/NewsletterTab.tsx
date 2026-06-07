"use client";

import Image from "next/image";
import { CldUploadButton } from "next-cloudinary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";
import { useTranslation } from "@/providers/language/LanguageContext";
import type {
  StoreSettings,
  SetSettings,
  HandleInputChange,
  UploadHandler,
} from "../settingsTypes";

interface NewsletterTabProps {
  settings: StoreSettings;
  setSettings: SetSettings;
  handleInputChange: HandleInputChange;
  handleNewsletterBannerUpload: UploadHandler;
  saveNewsletterSettings: () => void;
  isLoading: boolean;
}

export default function NewsletterTab({
  settings,
  setSettings,
  handleInputChange,
  handleNewsletterBannerUpload,
  saveNewsletterSettings,
  isLoading,
}: NewsletterTabProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.newsletter.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white dark:text-white">
                {t("admin-settings.sections.newsletter.title")}
              </label>
              <MultiLangInput
                value={settings.newsletterSettings.title}
                onChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    newsletterSettings: {
                      ...prev.newsletterSettings,
                      title: value,
                    },
                  }));
                }}
                placeholder={{
                  en: "Enter newsletter title in English (e.g. Subscribe to Our Newsletter)",
                  "zh-TW": "輸入電子報標題（例：訂閱我們的電子報）",
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white dark:text-white">
                {t("admin-settings.sections.newsletter.subtitle")}
              </label>
              <MultiLangInput
                value={settings.newsletterSettings.subtitle}
                onChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    newsletterSettings: {
                      ...prev.newsletterSettings,
                      subtitle: value,
                    },
                  }));
                }}
                placeholder={{
                  en: "Enter newsletter subtitle in English (e.g. Get 15% off your first order!)",
                  "zh-TW": "輸入電子報副標題（例：首次訂單可享85折優惠！）",
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-4">
                {t("admin-settings.sections.newsletter.bannerImage")}
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={
                      settings.newsletterSettings?.bannerImage ||
                      "/newsletter.jpg"
                    }
                    alt={t("admin-settings.sections.newsletter.bannerImage")}
                    fill
                    className="object-cover"
                  />
                </div>
                <CldUploadButton
                  className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                  options={{ maxFiles: 1 }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={handleNewsletterBannerUpload}
                >
                  {t("admin-settings.sections.newsletter.changeBanner")}
                </CldUploadButton>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.newsletter.discountPercentage")}
              </label>
              <Input
                type="number"
                name="discountPercentage"
                value={settings.newsletterSettings?.discountPercentage || ""}
                onChange={(e) => handleInputChange(e, "newsletterSettings")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white dark:text-white">
                {t("admin-settings.sections.newsletter.buttonText")}
              </label>
              <MultiLangInput
                value={settings.newsletterSettings.buttonText}
                onChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    newsletterSettings: {
                      ...prev.newsletterSettings,
                      buttonText: value,
                    },
                  }));
                }}
                placeholder={{
                  en: t("newsletter.buttonText"),
                  "zh-TW": t("newsletter.buttonText", { lng: "zh-TW" }),
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white dark:text-white">
                {t("admin-settings.sections.newsletter.disclaimer")}
              </label>
              <MultiLangInput
                value={settings.newsletterSettings.disclaimer}
                onChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    newsletterSettings: {
                      ...prev.newsletterSettings,
                      disclaimer: value,
                    },
                  }));
                }}
                placeholder={{
                  en: t("newsletter.disclaimer"),
                  "zh-TW": t("newsletter.disclaimer", { lng: "zh-TW" }),
                }}
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={saveNewsletterSettings}
              className="w-full md:w-auto bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
              disabled={isLoading}
            >
              {isLoading
                ? t("admin-settings.actions.saving")
                : t("admin-settings.actions.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
