"use client";

import Image from "next/image";
import { CldUploadButton } from "next-cloudinary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";
import { useTranslation } from "@/providers/language/LanguageContext";
import type {
  StoreSettings,
  MultiLangValue,
  SetSettings,
  HandleInputChange,
  UploadHandler,
} from "../settingsTypes";

interface GeneralTabProps {
  settings: StoreSettings;
  setSettings: SetSettings;
  handleInputChange: HandleInputChange;
  handleLogoUpload: UploadHandler;
  saveSettings: () => void;
  isLoading: boolean;
}

export default function GeneralTab({
  settings,
  setSettings,
  handleInputChange,
  handleLogoUpload,
  saveSettings,
  isLoading,
}: GeneralTabProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.store.title")}
          </h3>
          <div className="space-y-4">
            <div className="mb-4">
              <MultiLangInput
                label={t("admin-settings.sections.store.storeName")}
                value={settings.storeName}
                onChange={(value: MultiLangValue) =>
                  handleInputChange(value, "storeName")
                }
                placeholder={{
                  en: "Enter store name in English",
                  "zh-TW": "輸入商店名稱",
                }}
              />
            </div>
            <div>
              <MultiLangInput
                label={t("admin-settings.sections.store.slogan")}
                value={settings.slogan}
                onChange={(value: MultiLangValue) =>
                  handleInputChange(value, "slogan")
                }
                placeholder={{
                  en: "Enter store slogan in English",
                  "zh-TW": "輸入商店標語",
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.store.logo")}
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {settings.logo ? (
                    <Image
                      src={settings.logo}
                      alt={t("admin-settings.sections.store.logo")}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <Image
                      src="/images/placeholder-logo.png"
                      alt={t("admin-settings.sections.store.logo")}
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
                <CldUploadButton
                  className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#535C91] dark:focus:ring-[#6B74A9]"
                  options={{ maxFiles: 1 }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={handleLogoUpload}
                >
                  {t("admin-settings.sections.store.changeLogo")}
                </CldUploadButton>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.business.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.business.weekdays")}
              </label>
              <MultiLangInput
                value={settings.businessHours.weekdays}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    businessHours: {
                      ...prev.businessHours,
                      weekdays: value,
                    },
                  }))
                }
                placeholder={{
                  en: "Enter weekday hours (e.g. Mon-Fri: 9am-6pm)",
                  "zh-TW": "輸入平日營業時間（例：週一至週五：上午9點至下午6點）",
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.business.weekends")}
              </label>
              <MultiLangInput
                value={settings.businessHours.weekends}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    businessHours: {
                      ...prev.businessHours,
                      weekends: value,
                    },
                  }))
                }
                placeholder={{
                  en: "Enter weekend hours (e.g. Sat-Sun: 10am-4pm)",
                  "zh-TW": "輸入週末營業時間（例：週六至週日：上午10點至下午4點）",
                }}
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
            {t("admin-settings.sections.social.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="facebook"
                className="block text-sm font-medium mb-1"
              >
                {t("admin-settings.sections.social.facebook")}
              </label>
              <Input
                id="facebook"
                name="socialMedia.facebook"
                value={settings?.socialMedia?.facebook || ""}
                onChange={handleInputChange}
                placeholder="https://facebook.com/your-page"
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="instagram"
                className="block text-sm font-medium mb-1"
              >
                {t("admin-settings.sections.social.instagram")}
              </label>
              <Input
                id="instagram"
                name="socialMedia.instagram"
                value={settings?.socialMedia?.instagram || ""}
                onChange={handleInputChange}
                placeholder="https://instagram.com/your-profile"
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="twitter"
                className="block text-sm font-medium mb-1"
              >
                {t("admin-settings.sections.social.twitter")}
              </label>
              <Input
                id="twitter"
                name="socialMedia.twitter"
                value={settings?.socialMedia?.twitter || ""}
                onChange={handleInputChange}
                placeholder="https://twitter.com/your-handle"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.shipping.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.shipping.standardDays")}
              </label>
              <Input
                name="standardDays"
                value={settings.shippingInfo.standardDays}
                onChange={(e) => handleInputChange(e, "shippingInfo")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.shipping.expressDays")}
              </label>
              <Input
                name="expressDays"
                value={settings.shippingInfo.expressDays}
                onChange={(e) => handleInputChange(e, "shippingInfo")}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showShippingInfo"
                checked={settings.shippingInfo?.show || false}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    shippingInfo: {
                      ...prev.shippingInfo,
                      show: e.target.checked,
                    },
                  }));
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="showShippingInfo"
                className="text-sm font-medium"
              >
                {t("admin-settings.sections.shipping.show")}
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.shipping.sectionTitle")}
              </label>
              <MultiLangInput
                value={
                  settings.shippingInfo?.title || {
                    en: "",
                    "zh-TW": "",
                  }
                }
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    shippingInfo: {
                      ...prev.shippingInfo,
                      title: value,
                    },
                  }))
                }
                placeholder={{
                  en: t("admin-settings.sections.shipping.sectionTitle"),
                  "zh-TW": t("admin-settings.sections.shipping.sectionTitle"),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.shipping.standardShippingTitle")}
              </label>
              <MultiLangInput
                value={
                  settings.shippingInfo?.standardShipping || {
                    en: "",
                    "zh-TW": "",
                  }
                }
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    shippingInfo: {
                      ...prev.shippingInfo,
                      standardShipping: value,
                    },
                  }))
                }
                placeholder={{
                  en: t(
                    "admin-settings.sections.shipping.standardShippingTitle"
                  ),
                  "zh-TW": t(
                    "admin-settings.sections.shipping.standardShippingTitle"
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.shipping.expressShippingTitle")}
              </label>
              <MultiLangInput
                value={
                  settings.shippingInfo?.expressShipping || {
                    en: "",
                    "zh-TW": "",
                  }
                }
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    shippingInfo: {
                      ...prev.shippingInfo,
                      expressShipping: value,
                    },
                  }))
                }
                placeholder={{
                  en: t(
                    "admin-settings.sections.shipping.expressShippingTitle"
                  ),
                  "zh-TW": t(
                    "admin-settings.sections.shipping.expressShippingTitle"
                  ),
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.return.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.return.daysToReturn")}
              </label>
              <Input
                type="number"
                name="daysToReturn"
                value={settings.returnPolicy.daysToReturn}
                onChange={(e) => handleInputChange(e, "returnPolicy")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.return.conditions")}
              </label>
              <MultiLangInput
                value={settings.returnPolicy.conditions}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    returnPolicy: {
                      ...prev.returnPolicy,
                      conditions: value,
                    },
                  }))
                }
                placeholder={{
                  en: "Enter return policy conditions in English",
                  "zh-TW": "輸入退貨政策條件",
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showReturnPolicy"
                checked={settings.returnPolicy?.show || false}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    returnPolicy: {
                      ...prev.returnPolicy,
                      show: e.target.checked,
                    },
                  }));
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="showReturnPolicy"
                className="text-sm font-medium"
              >
                {t("admin-settings.sections.return.show")}
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.return.sectionTitle")}
              </label>
              <MultiLangInput
                value={
                  settings.returnPolicy?.title || {
                    en: "",
                    "zh-TW": "",
                  }
                }
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    returnPolicy: {
                      ...prev.returnPolicy,
                      title: value,
                    },
                  }))
                }
                placeholder={{
                  en: "Enter return policy section title in English",
                  "zh-TW": "輸入退貨政策標題",
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <MultiLangInput
            label={t("admin-settings.sections.store.copyright")}
            value={settings.copyright}
            onChange={(value: MultiLangValue) =>
              handleInputChange(value, "copyright")
            }
            placeholder={{
              en: "Enter copyright text in English (e.g. © 2024 Your Store. All rights reserved.)",
              "zh-TW": "輸入版權文字（例：© 2024 您的商店。保留所有權利。）",
            }}
          />
        </div>

        <Button
          onClick={saveSettings}
          className="w-full md:w-auto bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
          disabled={isLoading}
        >
          {isLoading
            ? t("admin-settings.actions.saving")
            : t("admin-settings.actions.save")}
        </Button>
      </div>
    </div>
  );
}
