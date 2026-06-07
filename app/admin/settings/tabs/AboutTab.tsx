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
  UploadHandler,
  TeamMemberUploadHandler,
  AddArrayItem,
  RemoveArrayItem,
} from "../settingsTypes";

interface AboutTabProps {
  settings: StoreSettings;
  setSettings: SetSettings;
  handleAddArrayItem: AddArrayItem;
  handleRemoveArrayItem: RemoveArrayItem;
  handleAboutBannerUpload: UploadHandler;
  handleStoryImageUpload: UploadHandler;
  handleTeamMemberImageUpload: TeamMemberUploadHandler;
  saveAboutPageSettings: () => void;
  isLoading: boolean;
}

export default function AboutTab({
  settings,
  setSettings,
  handleAddArrayItem,
  handleRemoveArrayItem,
  handleAboutBannerUpload,
  handleStoryImageUpload,
  handleTeamMemberImageUpload,
  saveAboutPageSettings,
  isLoading,
}: AboutTabProps) {
  const { t, language } = useTranslation();

  return (
    <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.about.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.aboutPageSection.title")}
              </label>
              <MultiLangInput
                value={settings.aboutPage.title}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutPage: { ...prev.aboutPage, title: value },
                  }))
                }
                placeholder={{
                  en: t(
                    "admin-settings.sections.about.aboutPageSection.title"
                  ),
                  "zh-TW": t(
                    "admin-settings.sections.about.aboutPageSection.title"
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.aboutPageSection.subtitle")}
              </label>
              <MultiLangInput
                value={settings.aboutPage.subtitle}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutPage: { ...prev.aboutPage, subtitle: value },
                  }))
                }
                placeholder={{
                  en: t(
                    "admin-settings.sections.about.aboutPageSection.subtitle"
                  ),
                  "zh-TW": t(
                    "admin-settings.sections.about.aboutPageSection.subtitle"
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t(
                  "admin-settings.sections.about.aboutPageSection.bannerImage"
                )}
              </label>
              <div className="flex items-center space-x-4">
                {/* About Page Banner */}
                <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {settings.aboutPage.bannerImage ? (
                    <Image
                      src={settings.aboutPage.bannerImage}
                      alt="About Banner"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src="/images/banner-default.svg"
                      alt="About Banner"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <CldUploadButton
                  className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                  options={{ maxFiles: 1 }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={handleAboutBannerUpload}
                >
                  {t(
                    "admin-settings.sections.about.aboutPageSection.changeBanner"
                  )}
                </CldUploadButton>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.about.storySection.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.storySection.title")}
              </label>
              <MultiLangInput
                value={settings.aboutPage.story.title}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutPage: {
                      ...prev.aboutPage,
                      story: { ...prev.aboutPage.story, title: value },
                    },
                  }))
                }
                placeholder={{
                  en: t("admin-settings.sections.about.storySection.title"),
                  "zh-TW": t(
                    "admin-settings.sections.about.storySection.title"
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.storySection.content")}
              </label>
              <MultiLangInput
                type="textarea"
                value={settings.aboutPage.story.content}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutPage: {
                      ...prev.aboutPage,
                      story: {
                        ...prev.aboutPage.story,
                        content: value,
                      },
                    },
                  }))
                }
                placeholder={{
                  en: t("admin-settings.sections.about.storySection.content"),
                  "zh-TW": t(
                    "admin-settings.sections.about.storySection.content"
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.storySection.storyImage")}
              </label>
              <div className="flex items-center space-x-4">
                {/* Story Image */}
                <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {settings.aboutPage.story.image ? (
                    <Image
                      src={settings.aboutPage.story.image}
                      alt="Story Image"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src="/images/banner-default.svg"
                      alt="Story Image"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <CldUploadButton
                  className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                  options={{ maxFiles: 1 }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={handleStoryImageUpload}
                >
                  {t("admin-settings.sections.about.storySection.changeImage")}
                </CldUploadButton>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.about.valuesSection.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.valuesSection.title")}
              </label>
              <MultiLangInput
                value={settings.aboutPage.values.title}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutPage: {
                      ...prev.aboutPage,
                      values: {
                        ...prev.aboutPage.values,
                        title: value,
                      },
                    },
                  }))
                }
                placeholder={{
                  en: t("admin-settings.sections.about.valuesSection.title"),
                  "zh-TW": t(
                    "admin-settings.sections.about.valuesSection.title",
                    {
                      lng: "zh-TW",
                    }
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.valuesSection.values")}
              </label>
              {settings.aboutPage.values.items.map((value, index) => (
                <div key={index} className="flex gap-4 mb-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "admin-settings.sections.about.valuesSection.title"
                        )}
                      </label>
                      <MultiLangInput
                        value={value.title}
                        onChange={(newValue) => {
                          const newItems = [
                            ...settings.aboutPage.values.items,
                          ];
                          newItems[index] = {
                            ...newItems[index],
                            title: newValue,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              values: {
                                ...prev.aboutPage.values,
                                items: newItems,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: t(
                            "admin-settings.sections.about.valuesSection.title"
                          ),
                          "zh-TW": t(
                            "admin-settings.sections.about.valuesSection.title",
                            { lng: "zh-TW" }
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "admin-settings.sections.about.valuesSection.description"
                        )}
                      </label>
                      <MultiLangInput
                        type="textarea"
                        value={value.description}
                        onChange={(newValue) => {
                          const newItems = [
                            ...settings.aboutPage.values.items,
                          ];
                          newItems[index] = {
                            ...newItems[index],
                            description: newValue,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              values: {
                                ...prev.aboutPage.values,
                                items: newItems,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: t(
                            "admin-settings.sections.about.valuesSection.description"
                          ),
                          "zh-TW": t(
                            "admin-settings.sections.about.valuesSection.description",
                            { lng: "zh-TW" }
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "admin-settings.sections.about.valuesSection.iconName"
                        )}
                      </label>
                      <Input
                        value={value.icon}
                        onChange={(e) => {
                          const newItems = [
                            ...settings.aboutPage.values.items,
                          ];
                          newItems[index] = {
                            ...newItems[index],
                            icon: e.target.value,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              values: {
                                ...prev.aboutPage.values,
                                items: newItems,
                              },
                            },
                          }));
                        }}
                        placeholder={t(
                          "admin-settings.sections.about.valuesSection.iconName"
                        )}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      handleRemoveArrayItem(
                        "aboutPage",
                        "values",
                        "items",
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
                  handleAddArrayItem("aboutPage", "values", "items", {
                    title: {
                      en: "",
                      "zh-TW": "",
                    },
                    description: {
                      en: "",
                      "zh-TW": "",
                    },
                    icon: "",
                  })
                }
                variant="outline"
                className="mt-2"
              >
                {t("admin-settings.sections.about.valuesSection.addValue")}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.about.teamSection.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.teamSection.title")}
              </label>
              <MultiLangInput
                value={settings.aboutPage.team.title}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutPage: {
                      ...prev.aboutPage,
                      team: {
                        ...prev.aboutPage.team,
                        title: value,
                      },
                    },
                  }))
                }
                placeholder={{
                  en: t("admin-settings.sections.about.teamSection.title"),
                  "zh-TW": t(
                    "admin-settings.sections.about.teamSection.title",
                    {
                      lng: "zh-TW",
                    }
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("admin-settings.sections.about.teamSection.teamMembers")}
              </label>
              {settings.aboutPage.team.members.map((member, index) => (
                <div key={index} className="flex gap-4 mb-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("admin-settings.sections.about.teamSection.name")}
                      </label>
                      <MultiLangInput
                        value={member.name}
                        onChange={(value) => {
                          const newMembers = [
                            ...settings.aboutPage.team.members,
                          ];
                          newMembers[index] = {
                            ...newMembers[index],
                            name: value,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              team: {
                                ...prev.aboutPage.team,
                                members: newMembers,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: t(
                            "admin-settings.sections.about.teamSection.name"
                          ),
                          "zh-TW": t(
                            "admin-settings.sections.about.teamSection.name",
                            { lng: "zh-TW" }
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("admin-settings.sections.about.teamSection.role")}
                      </label>
                      <MultiLangInput
                        value={member.role}
                        onChange={(value) => {
                          const newMembers = [
                            ...settings.aboutPage.team.members,
                          ];
                          newMembers[index] = {
                            ...newMembers[index],
                            role: value,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              team: {
                                ...prev.aboutPage.team,
                                members: newMembers,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: t(
                            "admin-settings.sections.about.teamSection.role"
                          ),
                          "zh-TW": t(
                            "admin-settings.sections.about.teamSection.role",
                            { lng: "zh-TW" }
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "admin-settings.sections.about.teamSection.description"
                        )}
                      </label>
                      <MultiLangInput
                        value={member.description}
                        onChange={(value) => {
                          const newMembers = [
                            ...settings.aboutPage.team.members,
                          ];
                          newMembers[index] = {
                            ...newMembers[index],
                            description: value,
                          };
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              team: {
                                ...prev.aboutPage.team,
                                members: newMembers,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: t(
                            "admin-settings.sections.about.teamSection.description"
                          ),
                          "zh-TW": t(
                            "admin-settings.sections.about.teamSection.description",
                            { lng: "zh-TW" }
                          ),
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={`${member.name[language]} - ${member.role[language]}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Image
                            src="/images/placeholder-logo.png"
                            alt={`${member.name[language]} - ${member.role[language]}`}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <CldUploadButton
                          className="h-9 px-3 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                          options={{ maxFiles: 1 }}
                          uploadPreset={
                            process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                          }
                          onSuccess={(result) =>
                            handleTeamMemberImageUpload(result, index)
                          }
                        >
                          {t("admin-settings.sections.about.teamSection.change")}
                        </CldUploadButton>
                        <Button
                          onClick={() =>
                            handleRemoveArrayItem(
                              "aboutPage",
                              "team",
                              "members",
                              index
                            )
                          }
                          variant="destructive"
                          size="sm"
                          className="h-9 px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                onClick={() => {
                  handleAddArrayItem("aboutPage", "team", "members", {
                    name: { en: "", "zh-TW": "" },
                    role: { en: "", "zh-TW": "" },
                    image: "",
                    description: { en: "", "zh-TW": "" },
                  });
                }}
                variant="outline"
                className="mt-2"
              >
                {t("admin-settings.sections.about.teamSection.addTeamMember")}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={saveAboutPageSettings}
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
