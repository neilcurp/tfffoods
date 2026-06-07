"use client";

import Image from "next/image";
import { CldUploadButton } from "next-cloudinary";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";
import { useTranslation } from "@/providers/language/LanguageContext";
import type {
  StoreSettings,
  SetSettings,
  HandleInputChange,
  UploadHandler,
  AddArrayItem,
  RemoveArrayItem,
  CoordinateUpdate,
} from "../settingsTypes";

interface ContactTabProps {
  settings: StoreSettings;
  setSettings: SetSettings;
  handleInputChange: HandleInputChange;
  handleContactBannerUpload: UploadHandler;
  handleSupportChannelsImageUpload: UploadHandler;
  handleAddArrayItem: AddArrayItem;
  handleRemoveArrayItem: RemoveArrayItem;
  handleCoordinateUpdate: CoordinateUpdate;
  saveContactPageSettings: () => void;
  isLoading: boolean;
  mapsLoaded: boolean;
}

export default function ContactTab({
  settings,
  setSettings,
  handleInputChange,
  handleContactBannerUpload,
  handleSupportChannelsImageUpload,
  handleAddArrayItem,
  handleRemoveArrayItem,
  handleCoordinateUpdate,
  saveContactPageSettings,
  isLoading,
  mapsLoaded,
}: ContactTabProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.contact_page.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.contact_page.title")}
              </label>
              <MultiLangInput
                value={settings.contactPage.title}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactPage: { ...prev.contactPage, title: value },
                  }))
                }
                placeholder={{
                  en: "Enter contact page title in English (e.g. Contact Us)",
                  "zh-TW": "輸入聯絡頁面標題（例：聯絡我們）",
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.contact_page.subtitle")}
              </label>
              <MultiLangInput
                value={settings.contactPage.subtitle}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactPage: {
                      ...prev.contactPage,
                      subtitle: value,
                    },
                  }))
                }
                placeholder={{
                  en: "Enter contact page subtitle in English (e.g. Get in Touch with Us)",
                  "zh-TW": "輸入聯絡頁面副標題（例：與我們聯繫）",
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.contact_page.bannerImage")}
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {settings.contactPage.bannerImage ? (
                    <Image
                      src={settings.contactPage.bannerImage}
                      alt="Contact Banner"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src="/images/banner-default.svg"
                      alt="Contact Banner"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <CldUploadButton
                  className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                  options={{ maxFiles: 1 }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={handleContactBannerUpload}
                >
                  {t("admin-settings.sections.contact_page.changeBanner")}
                </CldUploadButton>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.contact.contactInfo.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.contact.contactInfo.title")}
              </label>
              <MultiLangInput
                value={settings.contactPage.contactInfo.title}
                onChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    contactPage: {
                      ...prev.contactPage,
                      contactInfo: {
                        ...prev.contactPage.contactInfo,
                        title: value,
                      },
                    },
                  }));
                }}
                placeholder={{
                  en: "Enter contact info section title in English (e.g. Our Locations)",
                  "zh-TW": "輸入聯絡資訊區段標題（例：我們的據點）",
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t(
                  "admin-settings.sections.contact.contactInfo.officeLocations"
                )}
              </label>
              {settings.contactPage.contactInfo.officeLocations.map(
                (location, index) => (
                  <div
                    key={index}
                    className="group relative mb-6 bg-card/50 rounded-lg p-6 border border-border"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {t(
                            "admin-settings.sections.contact.contactInfo.locationName"
                          )}
                        </label>
                        <MultiLangInput
                          value={location.name}
                          onChange={(value) => {
                            const newLocations = [
                              ...settings.contactPage.contactInfo
                                .officeLocations,
                            ];
                            newLocations[index] = {
                              ...newLocations[index],
                              name: value,
                            };
                            setSettings((prev) => ({
                              ...prev,
                              contactPage: {
                                ...prev.contactPage,
                                contactInfo: {
                                  ...prev.contactPage.contactInfo,
                                  officeLocations: newLocations,
                                },
                              },
                            }));
                          }}
                          placeholder={{
                            en: "Enter location name in English (e.g. Downtown Store)",
                            "zh-TW": "輸入據點名稱（例：市中心店）",
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {t(
                            "admin-settings.sections.contact.contactInfo.address"
                          )}
                        </label>
                        <MultiLangInput
                          value={location.address}
                          onChange={(value) => {
                            const newLocations = [
                              ...settings.contactPage.contactInfo
                                .officeLocations,
                            ];
                            newLocations[index] = {
                              ...newLocations[index],
                              address: value,
                            };
                            setSettings((prev) => ({
                              ...prev,
                              contactPage: {
                                ...prev.contactPage,
                                contactInfo: {
                                  ...prev.contactPage.contactInfo,
                                  officeLocations: newLocations,
                                },
                              },
                            }));
                          }}
                          placeholder={{
                            en: "Enter full address in English",
                            "zh-TW": "輸入完整地址",
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {t(
                            "admin-settings.sections.contact.contactInfo.phoneNumber"
                          )}
                        </label>
                        <Input
                          name={`contactInfo.officeLocations.${index}.phone`}
                          value={location.phone}
                          onChange={(e) => handleInputChange(e, "contactPage")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {t(
                            "admin-settings.sections.contact.contactInfo.emailAddress"
                          )}
                        </label>
                        <Input
                          name={`contactInfo.officeLocations.${index}.email`}
                          value={location.email}
                          onChange={(e) => handleInputChange(e, "contactPage")}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t(
                              "admin-settings.sections.contact.contactInfo.latitude"
                            )}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.0001"
                              name={`contactInfo.officeLocations.${index}.coordinates.lat`}
                              value={location.coordinates?.lat || ""}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value);
                                setSettings((prev) => {
                                  const newSettings = { ...prev };
                                  const newLocations = [
                                    ...prev.contactPage.contactInfo
                                      .officeLocations,
                                  ];
                                  if (!newLocations[index].coordinates) {
                                    newLocations[index].coordinates = {
                                      lat: 0,
                                      lng: 0,
                                    };
                                  }
                                  newLocations[index].coordinates.lat =
                                    newValue || 0;
                                  newSettings.contactPage.contactInfo.officeLocations =
                                    newLocations;
                                  return newSettings;
                                });
                              }}
                              placeholder={t(
                                "admin-settings.sections.contact.contactInfo.latitude"
                              )}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t(
                              "admin-settings.sections.contact.contactInfo.longitude"
                            )}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.0001"
                              name={`contactInfo.officeLocations.${index}.coordinates.lng`}
                              value={location.coordinates?.lng || ""}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value);
                                setSettings((prev) => {
                                  const newSettings = { ...prev };
                                  const newLocations = [
                                    ...prev.contactPage.contactInfo
                                      .officeLocations,
                                  ];
                                  if (!newLocations[index].coordinates) {
                                    newLocations[index].coordinates = {
                                      lat: 0,
                                      lng: 0,
                                    };
                                  }
                                  newLocations[index].coordinates.lng =
                                    newValue || 0;
                                  newSettings.contactPage.contactInfo.officeLocations =
                                    newLocations;
                                  return newSettings;
                                });
                              }}
                              placeholder={t(
                                "admin-settings.sections.contact.contactInfo.longitude"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <Button
                          onClick={() =>
                            handleCoordinateUpdate(index, location)
                          }
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          disabled={!mapsLoaded || !location.address}
                        >
                          {t(
                            "admin-settings.sections.contact.contactInfo.getCoordinates"
                          )}
                        </Button>
                        <Button
                          onClick={() =>
                            handleRemoveArrayItem(
                              "contactPage",
                              "contactInfo",
                              "officeLocations",
                              index
                            )
                          }
                          variant="destructive"
                          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t(
                            "admin-settings.sections.contact.contactInfo.delete"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              )}
              <Button
                onClick={() =>
                  handleAddArrayItem(
                    "contactPage",
                    "contactInfo",
                    "officeLocations",
                    {
                      name: { en: "", "zh-TW": "" },
                      address: { en: "", "zh-TW": "" },
                      phone: "",
                      email: "",
                      hours: { en: "", "zh-TW": "" },
                      coordinates: { lat: 0, lng: 0 },
                    }
                  )
                }
                variant="outline"
                className="mt-2"
              >
                {t(
                  "admin-settings.sections.contact.contactInfo.addOfficeLocation"
                )}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.contact.supportChannels.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.contact.supportChannels.title")}
              </label>
              <MultiLangInput
                value={settings.contactPage.supportChannels.title}
                onChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    contactPage: {
                      ...prev.contactPage,
                      supportChannels: {
                        ...prev.contactPage.supportChannels,
                        title: value,
                      },
                    },
                  }));
                }}
                placeholder={{
                  en: t(
                    "admin-settings.sections.contact.supportChannels.title"
                  ),
                  "zh-TW": t(
                    "admin-settings.sections.contact.supportChannels.title"
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t(
                  "admin-settings.sections.contact.supportChannels.supportChannelsImage"
                )}
              </label>
              <div className="flex items-center space-x-4">
                {/* Support Channels Image */}
                <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {settings.contactPage.supportChannels.image ? (
                    <Image
                      src={settings.contactPage.supportChannels.image}
                      alt="Support Channels"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src="/images/support-default.svg"
                      alt="Support Channels"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <CldUploadButton
                  className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                  options={{ maxFiles: 1 }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={handleSupportChannelsImageUpload}
                >
                  {t(
                    "admin-settings.sections.contact.supportChannels.changeImage"
                  )}
                </CldUploadButton>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.contact.supportChannels.channels")}
              </label>
              {settings.contactPage.supportChannels.channels.map(
                (channel, index) => (
                  <div key={index} className="flex gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "admin-settings.sections.contact.supportChannels.title"
                        )}
                      </label>
                      <MultiLangInput
                        value={channel.title}
                        onChange={(value) => {
                          const newChannels = [
                            ...settings.contactPage.supportChannels.channels,
                          ];
                          newChannels[index] = {
                            ...newChannels[index],
                            title: value,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            contactPage: {
                              ...prev.contactPage,
                              supportChannels: {
                                ...prev.contactPage.supportChannels,
                                channels: newChannels,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: t(
                            "admin-settings.sections.contact.supportChannels.title"
                          ),
                          "zh-TW": t(
                            "admin-settings.sections.contact.supportChannels.title"
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "admin-settings.sections.contact.supportChannels.description"
                        )}
                      </label>
                      <MultiLangInput
                        value={channel.description}
                        onChange={(value) => {
                          const newChannels = [
                            ...settings.contactPage.supportChannels.channels,
                          ];
                          newChannels[index] = {
                            ...newChannels[index],
                            description: value,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            contactPage: {
                              ...prev.contactPage,
                              supportChannels: {
                                ...prev.contactPage.supportChannels,
                                channels: newChannels,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: t(
                            "admin-settings.sections.contact.supportChannels.description"
                          ),
                          "zh-TW": t(
                            "admin-settings.sections.contact.supportChannels.description"
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "admin-settings.sections.contact.supportChannels.iconName"
                        )}
                      </label>
                      <Input
                        value={channel.icon}
                        onChange={(e) => {
                          const newChannels = [
                            ...settings.contactPage.supportChannels.channels,
                          ];
                          newChannels[index] = {
                            ...newChannels[index],
                            icon: e.target.value,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            contactPage: {
                              ...prev.contactPage,
                              supportChannels: {
                                ...prev.contactPage.supportChannels,
                                channels: newChannels,
                              },
                            },
                          }));
                        }}
                        placeholder={t(
                          "admin-settings.sections.contact.supportChannels.iconName"
                        )}
                      />
                    </div>
                    <Button
                      onClick={() =>
                        handleRemoveArrayItem(
                          "contactPage",
                          "supportChannels",
                          "channels",
                          index
                        )
                      }
                      variant="destructive"
                      size="icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              )}
              <Button
                onClick={() =>
                  handleAddArrayItem(
                    "contactPage",
                    "supportChannels",
                    "channels",
                    {
                      title: { en: "", "zh-TW": "" },
                      description: { en: "", "zh-TW": "" },
                      icon: "",
                    }
                  )
                }
                variant="outline"
                className="mt-2"
              >
                {t(
                  "admin-settings.sections.contact.supportChannels.addChannel"
                )}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.contact.faqSection.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.contact.faqSection.title")}
              </label>
              <MultiLangInput
                value={settings.contactPage.faq.title}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactPage: {
                      ...prev.contactPage,
                      faq: { ...prev.contactPage.faq, title: value },
                    },
                  }))
                }
                placeholder={{
                  en: t("admin-settings.sections.contact.faqSection.title"),
                  "zh-TW": t(
                    "admin-settings.sections.contact.faqSection.title"
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.contact.faqSection.questions")}
              </label>
              {settings.contactPage.faq.questions.map((faq, index) => (
                <div key={index} className="flex gap-4 mb-4">
                  <MultiLangInput
                    value={faq.question}
                    onChange={(value) => {
                      const newQuestions = [
                        ...settings.contactPage.faq.questions,
                      ];
                      newQuestions[index] = {
                        ...newQuestions[index],
                        question: value,
                      };
                      setSettings((prev) => ({
                        ...prev,
                        contactPage: {
                          ...prev.contactPage,
                          faq: {
                            ...prev.contactPage.faq,
                            questions: newQuestions,
                          },
                        },
                      }));
                    }}
                    placeholder={{
                      en: t(
                        "admin-settings.sections.contact.faqSection.question"
                      ),
                      "zh-TW": t(
                        "admin-settings.sections.contact.faqSection.question"
                      ),
                    }}
                  />
                  <MultiLangInput
                    value={faq.answer}
                    onChange={(value) => {
                      const newQuestions = [
                        ...settings.contactPage.faq.questions,
                      ];
                      newQuestions[index] = {
                        ...newQuestions[index],
                        answer: value,
                      };
                      setSettings((prev) => ({
                        ...prev,
                        contactPage: {
                          ...prev.contactPage,
                          faq: {
                            ...prev.contactPage.faq,
                            questions: newQuestions,
                          },
                        },
                      }));
                    }}
                    placeholder={{
                      en: t(
                        "admin-settings.sections.contact.faqSection.answer"
                      ),
                      "zh-TW": t(
                        "admin-settings.sections.contact.faqSection.answer"
                      ),
                    }}
                  />
                  <Button
                    onClick={() =>
                      handleRemoveArrayItem(
                        "contactPage",
                        "faq",
                        "questions",
                        index
                      )
                    }
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() =>
                  handleAddArrayItem("contactPage", "faq", "questions", {
                    question: { en: "", "zh-TW": "" },
                    answer: { en: "", "zh-TW": "" },
                  })
                }
                variant="outline"
                className="mt-2"
              >
                {t("admin-settings.sections.contact.faqSection.addFAQ")}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={saveContactPageSettings}
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
  );
}
