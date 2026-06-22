"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { numberInputDisplay, parseNumberInput } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, LayoutDashboard, Sliders, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/providers/language/LanguageContext";
import { MultiLangInput } from "@/components/MultiLangInput";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface Category {
  _id: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  specifications?: Specification[];
}

interface Specification {
  label: string;
  key?: string;
  type: "text" | "number" | "select";
  options?: {
    en: string[];
    "zh-TW": string[];
    prices?: number[];
  };
  required: boolean;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
}

type SpecificationField =
  | keyof Specification
  | "displayNames"
  | "descriptions"
  | "options";
type SpecificationValue =
  | string
  | boolean
  | string[]
  | {
      en: string;
      "zh-TW": string;
    }
  | {
      en: string | string[];
      "zh-TW": string | string[];
    };

export default function SpecificationsPage() {
  const { language, t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpecForm, setShowSpecForm] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("admin.specifications"),
      href: "/admin/specifications",
      icon: Sliders,
    },
  ];

  // Debug logging for specifications changes
  useEffect(() => {
    console.log("Specifications updated:", specifications);
  }, [specifications]);

  // Auto-switch to grid view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setViewMode("grid");
      } else {
        setViewMode("table"); // Reset to table view on desktop
      }
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch categories when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/admin/categories");
        setCategories(response.data); // API returns array directly
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error(t("specifications.error.load"));
      }
    };

    fetchCategories();
  }, [t]);

  // Fetch specifications when a category is selected
  const fetchSpecifications = useCallback(
    async (categoryId: string) => {
      try {
        setIsLoading(true);
        const response = await axios.get<{ specifications: Specification[] }>(
          `/api/admin/specifications/${categoryId}`
        );

        if (response.data?.specifications) {
          setSpecifications(response.data.specifications);
        } else {
          setSpecifications([]);
        }
      } catch (error) {
        console.error("Error fetching specifications:", error);
        toast.error(t("specifications.error.load"));
        setSpecifications([]);
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowSpecForm(true);
    fetchSpecifications(categoryId);
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      toast.error(t("specifications.validation.categoryRequired"));
      return;
    }

    try {
      setIsLoading(true);

      // If there are specifications, validate them
      if (specifications.length > 0) {
        const invalidSpecs = specifications.filter(
          (spec) => !spec.displayNames.en || !spec.displayNames["zh-TW"]
        );

        if (invalidSpecs.length > 0) {
          toast.error(t("specifications.validation.labelRequired"));
          return;
        }
      }

      // Prepare specifications for saving (even if empty)
      const specsToSave = specifications.map((spec) => ({
        ...spec,
        key:
          spec.key ||
          spec.displayNames.en.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        options:
          spec.type === "select" && spec.options
            ? {
                en: spec.options.en || [],
                "zh-TW": spec.options["zh-TW"] || [],
                prices: spec.options.prices || [],
              }
            : undefined,
        required: !!spec.required,
      }));

      // Always send the request, even with empty specifications
      const response = await axios.post(
        `/api/admin/specifications/${selectedCategory}`,
        { specifications: specsToSave }
      );

      if (response.data?.specifications !== undefined) {
        setSpecifications(response.data.specifications);
        toast.success(t("specifications.success.save"));

        // Refresh the categories list to show updated specifications
        const categoriesRes = await axios.get("/api/admin/categories");
        setCategories(categoriesRes.data);

        // Optionally return to the categories list after successful save
        if (specifications.length === 0) {
          setShowSpecForm(false);
          setSelectedCategory("");
        }
      }
    } catch (error) {
      console.error("Error saving specifications:", error);
      toast.error(t("specifications.error.save"));
    } finally {
      setIsLoading(false);
    }
  };

  const addSpecification = () => {
    const newSpec: Specification = {
      label: "",
      type: "text",
      required: false,
      displayNames: {
        en: "",
        "zh-TW": "",
      },
      descriptions: {
        en: "",
        "zh-TW": "",
      },
      options: {
        en: [],
        "zh-TW": [],
        prices: [],
      },
    };
    setSpecifications((prevSpecs) => [...prevSpecs, newSpec]);
  };

  const updateSpecification = (
    index: number,
    field: SpecificationField,
    value: SpecificationValue
  ) => {
    setSpecifications((prevSpecs) => {
      const newSpecs = [...prevSpecs];
      const spec = { ...newSpecs[index] };

      if (field === "displayNames" || field === "descriptions") {
        spec[field] = {
          ...spec[field],
          ...(value as { en: string; "zh-TW": string }),
        };
      } else if (field === "type") {
        spec.type = value as "text" | "number" | "select";
        if (value !== "select") {
          spec.options = undefined;
        }
      } else if (field === "options") {
        // Just store the raw input strings directly
        spec.options = value as { en: string[]; "zh-TW": string[] };
      } else {
        spec[
          field as keyof Omit<
            Specification,
            "displayNames" | "descriptions" | "options"
          >
        ] = value as never;
      }

      newSpecs[index] = spec;
      return newSpecs;
    });
  };

  const removeSpecification = (index: number) => {
    setSpecifications((prevSpecs) => prevSpecs.filter((_, i) => i !== index));
  };

  const renderSpecificationsList = (specifications: Specification[] = []) => {
    if (specifications.length === 0) {
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
          {t("specifications.list.empty")}
        </span>
      );
    }

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            {specifications.length} {t("specifications.list.items")}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {specifications.map((spec, index) => (
            <span
              key={spec.key || index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            >
              {spec.displayNames?.[language as "en" | "zh-TW"] ||
                spec.label ||
                `Specification ${index + 1}`}
              {spec.required && <span className="ml-1 text-red-500">*</span>}
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading && !showSpecForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
                {t("specifications.common.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t("specifications.common.description")}
              </p>
            </div>
            <Button
              onClick={async () => {
                try {
                  const response = await axios.post(
                    "/api/admin/specifications/update-translations"
                  );
                  if (response.data.success) {
                    toast.success(
                      "Specification translations updated successfully"
                    );
                    // Refresh the categories to show updated translations
                    const categoriesRes = await axios.get(
                      "/api/admin/categories"
                    );
                    setCategories(categoriesRes.data); // API returns array directly
                  }
                } catch (error) {
                  console.error("Error updating translations:", error);
                  toast.error("Failed to update translations");
                }
              }}
              variant="outline"
            >
              {t("specifications.list.updateTranslations")}
            </Button>
          </div>

          {!showSpecForm ? (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("specifications.list.categoryHeader")}
                    </TableHead>
                    <TableHead>
                      {t("specifications.list.specificationsCount")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("specifications.list.actionsHeader")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">
                        {category.displayNames[language as "en" | "zh-TW"]}
                      </TableCell>
                      <TableCell>
                        {renderSpecificationsList(category.specifications)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCategorySelect(category._id)}
                        >
                          <Settings2 className="h-4 w-4 mr-2" />
                          {t("specifications.list.manageButton")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {
                      categories.find((c) => c._id === selectedCategory)
                        ?.displayNames[language as "en" | "zh-TW"]
                    }
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("specifications.description")}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSpecForm(false);
                      setSelectedCategory("");
                      setSpecifications([]);
                    }}
                  >
                    {t("specifications.list.backButton")}
                  </Button>
                  <Button onClick={addSpecification}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("specifications.list.addButton")}
                  </Button>
                </div>
              </div>

              <div className="min-h-[300px] relative">
                {specifications.length > 0 ? (
                  <div className="space-y-4">
                    {specifications.map((spec, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-card shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <MultiLangInput
                                  label={t("specifications.form.label")}
                                  value={spec.displayNames}
                                  onChange={(value) =>
                                    updateSpecification(
                                      index,
                                      "displayNames",
                                      value
                                    )
                                  }
                                  placeholder={{
                                    en: t(
                                      "specifications.form.placeholder.label"
                                    ),
                                    "zh-TW": t(
                                      "specifications.form.placeholder.label"
                                    ),
                                  }}
                                />
                              </div>
                              <div>
                                <Label>{t("specifications.form.type")}</Label>
                                <Select
                                  value={spec.type}
                                  onValueChange={(value) =>
                                    updateSpecification(
                                      index,
                                      "type",
                                      value as "text" | "number" | "select"
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">
                                      {t(
                                        "specifications.form.typeOptions.text"
                                      )}
                                    </SelectItem>
                                    <SelectItem value="number">
                                      {t(
                                        "specifications.form.typeOptions.number"
                                      )}
                                    </SelectItem>
                                    <SelectItem value="select">
                                      {t(
                                        "specifications.form.typeOptions.select"
                                      )}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {spec.type === "select" && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>
                                    {t("specifications.form.options")}
                                  </Label>
                                  {(spec.options?.en || []).map(
                                    (_, optionIndex) => (
                                      <div
                                        key={optionIndex}
                                        className="flex gap-2 items-start"
                                      >
                                        <div className="flex-1">
                                          <Input
                                            type="text"
                                            value={
                                              spec.options?.en[optionIndex] ||
                                              ""
                                            }
                                            onChange={(e) => {
                                              const newOptions = {
                                                en: [
                                                  ...(spec.options?.en || []),
                                                ],
                                                "zh-TW": [
                                                  ...(spec.options?.["zh-TW"] ||
                                                    []),
                                                ],
                                                prices: [
                                                  ...(spec.options?.prices ||
                                                    []),
                                                ],
                                              };
                                              newOptions.en[optionIndex] =
                                                e.target.value;
                                              updateSpecification(
                                                index,
                                                "options",
                                                newOptions
                                              );
                                            }}
                                            placeholder="English option"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <Input
                                            type="text"
                                            value={
                                              spec.options?.["zh-TW"][
                                                optionIndex
                                              ] || ""
                                            }
                                            onChange={(e) => {
                                              const newOptions = {
                                                en: [
                                                  ...(spec.options?.en || []),
                                                ],
                                                "zh-TW": [
                                                  ...(spec.options?.["zh-TW"] ||
                                                    []),
                                                ],
                                                prices: [
                                                  ...(spec.options?.prices ||
                                                    []),
                                                ],
                                              };
                                              newOptions["zh-TW"][optionIndex] =
                                                e.target.value;
                                              updateSpecification(
                                                index,
                                                "options",
                                                newOptions
                                              );
                                            }}
                                            placeholder="中文選項"
                                          />
                                        </div>
                                        <div className="w-32">
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={numberInputDisplay(
                                              spec.options?.prices?.[optionIndex]
                                            )}
                                            onChange={(e) => {
                                              const newOptions = {
                                                en: [
                                                  ...(spec.options?.en || []),
                                                ],
                                                "zh-TW": [
                                                  ...(spec.options?.["zh-TW"] ||
                                                    []),
                                                ],
                                                prices: [
                                                  ...(spec.options?.prices ||
                                                    []),
                                                ],
                                              };
                                              newOptions.prices[optionIndex] =
                                                parseNumberInput(e.target.value);
                                              updateSpecification(
                                                index,
                                                "options",
                                                newOptions
                                              );
                                            }}
                                            placeholder="0"
                                          />
                                        </div>
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          onClick={() => {
                                            const newOptions = {
                                              en:
                                                spec.options?.en.filter(
                                                  (_, i) => i !== optionIndex
                                                ) || [],
                                              "zh-TW":
                                                spec.options?.["zh-TW"].filter(
                                                  (_, i) => i !== optionIndex
                                                ) || [],
                                              prices:
                                                spec.options?.prices?.filter(
                                                  (_, i) => i !== optionIndex
                                                ) || [],
                                            };
                                            updateSpecification(
                                              index,
                                              "options",
                                              newOptions
                                            );
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => {
                                      const newOptions = {
                                        en: [...(spec.options?.en || []), ""],
                                        "zh-TW": [
                                          ...(spec.options?.["zh-TW"] || []),
                                          "",
                                        ],
                                        prices: [
                                          ...(spec.options?.prices || []),
                                          0,
                                        ],
                                      };
                                      updateSpecification(
                                        index,
                                        "options",
                                        newOptions
                                      );
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("specifications.form.addOption")}
                                  </Button>
                                </div>
                              </div>
                            )}

                            <MultiLangInput
                              label={t("specifications.form.description")}
                              type="textarea"
                              value={spec.descriptions}
                              onChange={(value) =>
                                updateSpecification(
                                  index,
                                  "descriptions",
                                  value
                                )
                              }
                              placeholder={{
                                en: t(
                                  "specifications.form.placeholder.description"
                                ),
                                "zh-TW": t(
                                  "specifications.form.placeholder.description"
                                ),
                              }}
                            />

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`required-${index}`}
                                checked={spec.required}
                                onCheckedChange={(checked) =>
                                  updateSpecification(
                                    index,
                                    "required",
                                    Boolean(checked)
                                  )
                                }
                              />
                              <Label htmlFor={`required-${index}`}>
                                {t("specifications.form.required")}
                              </Label>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSpecification(index)}
                            className="ml-4"
                          >
                            {t("specifications.form.remove")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {t("specifications.list.empty")}
                      </p>
                      <Button onClick={addSpecification}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("specifications.list.addButton")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 border-t dark:border-gray-700 pt-4">
                <Button onClick={handleSave} disabled={isLoading} size="lg">
                  {isLoading
                    ? t("specifications.list.savingButton")
                    : t("specifications.list.saveButton")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
