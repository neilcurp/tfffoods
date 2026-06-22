"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, LayoutDashboard, Grid } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useConfirm } from "@/components/ui/confirm-provider";
import { numberInputDisplay, parseNumberInput } from "@/lib/utils";
import { MultiLangInput } from "@/components/MultiLangInput";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Category {
  _id: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  order: number;
  isActive: boolean;
}

interface ApiError {
  message?: string;
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const { language, t } = useTranslation();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    displayNames: {
      en: "",
      "zh-TW": "",
    },
    descriptions: {
      en: "",
      "zh-TW": "",
    },
    order: 0,
    isActive: true,
  });
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.categories"),
      href: "/admin/categories",
      icon: Grid,
    },
  ];

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

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/admin/categories");
      setCategories(response.data || []); // API now returns array directly
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.admin) {
      fetchCategories();
    }
  }, [status, session, fetchCategories]);

  const handleCreateCategory = async () => {
    if (
      !newCategory.displayNames.en.trim() ||
      !newCategory.displayNames["zh-TW"].trim()
    ) {
      toast.error(t("categories.validation.nameRequired"));
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post("/api/admin/categories", {
        name: newCategory.displayNames.en.toLowerCase().replace(/\s+/g, "-"),
        displayNames: {
          en: newCategory.displayNames.en.trim(),
          "zh-TW": newCategory.displayNames["zh-TW"].trim(),
        },
        descriptions: {
          en: newCategory.descriptions.en.trim(),
          "zh-TW": newCategory.descriptions["zh-TW"].trim(),
        },
        order: parseInt(String(newCategory.order)) || 0,
        isActive: Boolean(newCategory.isActive),
      });

      // Update categories list with the new category
      setCategories((prev) => [...prev, response.data]);
      setShowCreateModal(false);
      setNewCategory({
        name: "",
        displayNames: { en: "", "zh-TW": "" },
        descriptions: { en: "", "zh-TW": "" },
        order: 0,
        isActive: true,
      });
      toast.success(t("categories.create.success"));

      // Refresh the categories list to get the updated order
      fetchCategories();
    } catch (error) {
      console.error("Create category error:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.error || t("categories.create.error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      setIsLoading(true);
      const response = await axios.put(
        `/api/admin/categories/${editingCategory._id}`,
        {
          name: editingCategory.displayNames.en
            .toLowerCase()
            .replace(/\s+/g, "-"),
          displayNames: {
            en: editingCategory.displayNames.en.trim(),
            "zh-TW": editingCategory.displayNames["zh-TW"].trim(),
          },
          descriptions: {
            en: editingCategory.descriptions.en.trim(),
            "zh-TW": editingCategory.descriptions["zh-TW"].trim(),
          },
          order: parseInt(String(editingCategory.order)) || 0,
          isActive: Boolean(editingCategory.isActive),
        }
      );

      // Update categories list with the updated category
      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === editingCategory._id ? response.data : cat
        )
      );
      setShowEditModal(false);
      setEditingCategory(null);
      toast.success(t("categories.update.success"));

      // Refresh the categories list to get the updated order
      fetchCategories();
    } catch (error) {
      console.error("Update category error:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.error || t("categories.update.error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const confirmed = await confirm({
      title: t("common.delete"),
      description: t("categories.delete.confirm"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;

    try {
      await axios.delete(`/api/admin/categories/${categoryId}`);
      setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
      toast.success(t("categories.delete.success"));
    } catch (error) {
      console.error("Delete category error:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.error || t("categories.delete.error")
      );
    }
  };

  if (status === "loading") {
    return <div>{t("common.loading")}</div>;
  }

  if (!session?.user?.admin) {
    return <div>{t("common.unauthorized")}</div>;
  }

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
                {t("categories.common.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t("categories.common.description")}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="hidden sm:block">
                <Button
                  variant="outline"
                  onClick={() =>
                    setViewMode(viewMode === "table" ? "grid" : "table")
                  }
                >
                  {viewMode === "table"
                    ? t("categories.common.gridView")
                    : t("categories.common.tableView")}
                </Button>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#F3B664] hover:bg-[#F1A649] dark:bg-[#F3B664] dark:hover:bg-[#F1A649] text-white"
              >
                {t("categories.create.button")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-10">{t("common.loading")}</div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center py-10">
              {t("categories.list.empty")}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="bg-card/50 rounded-lg shadow p-4 flex flex-col gap-2"
                >
                  <div className="font-semibold text-lg text-gray-900 dark:text-gray-100 break-all">
                    {category.displayNames[language as "en" | "zh-TW"]}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {category.descriptions[language as "en" | "zh-TW"]}
                  </div>
                  <div className="flex justify-end mt-2 gap-2">
                    <Button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowEditModal(true);
                      }}
                      className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(category._id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("common.delete")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">
                      {t("categories.list.nameHeader")}
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">
                      {t("categories.list.descriptionHeader")}
                    </th>
                    <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-300">
                      {t("categories.list.actionsHeader")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                        {category.displayNames[language as "en" | "zh-TW"]}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {category.descriptions[language as "en" | "zh-TW"]}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => {
                              setEditingCategory(category);
                              setShowEditModal(true);
                            }}
                            className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            {t("common.edit")}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(category._id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("common.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {t("categories.create.title")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {t("categories.create.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <MultiLangInput
              label={t("categories.fields.name")}
              value={newCategory.displayNames}
              onChange={(value) =>
                setNewCategory({ ...newCategory, displayNames: value })
              }
              placeholder={{
                en: "Category name in English",
                "zh-TW": "類別名稱",
              }}
            />
            <MultiLangInput
              label={t("categories.fields.description")}
              type="textarea"
              value={newCategory.descriptions}
              onChange={(value) =>
                setNewCategory({ ...newCategory, descriptions: value })
              }
              placeholder={{
                en: "Category description in English",
                "zh-TW": "類別描述",
              }}
            />
            <div>
              <Label>{t("categories.fields.order")}</Label>
              <Input
                type="number"
                min="0"
                value={numberInputDisplay(newCategory.order)}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    order: parseNumberInput(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newCategory.isActive}
                onCheckedChange={(checked) =>
                  setNewCategory({ ...newCategory, isActive: checked })
                }
              />
              <Label>{t("categories.fields.active")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="border-gray-200 dark:border-gray-700"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={
                isLoading ||
                !newCategory.displayNames.en ||
                !newCategory.displayNames["zh-TW"]
              }
              className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
            >
              {isLoading ? t("common.creating") : t("categories.create.button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {t("categories.edit.title")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {t("categories.edit.description")}
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <MultiLangInput
                label={t("categories.fields.name")}
                value={editingCategory.displayNames}
                onChange={(value) =>
                  setEditingCategory({
                    ...editingCategory,
                    displayNames: value,
                  })
                }
                placeholder={{
                  en: "Category name in English",
                  "zh-TW": "類別名稱",
                }}
              />
              <MultiLangInput
                label={t("categories.fields.description")}
                type="textarea"
                value={editingCategory.descriptions}
                onChange={(value) =>
                  setEditingCategory({
                    ...editingCategory,
                    descriptions: value,
                  })
                }
                placeholder={{
                  en: "Category description in English",
                  "zh-TW": "類別描述",
                }}
              />
              <div>
                <Label>{t("categories.fields.order")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={numberInputDisplay(editingCategory?.order)}
                  onChange={(e) =>
                    setEditingCategory(
                      editingCategory
                        ? {
                            ...editingCategory,
                            order: parseNumberInput(e.target.value),
                          }
                        : null
                    )
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingCategory.isActive}
                  onCheckedChange={(checked) =>
                    setEditingCategory({
                      ...editingCategory,
                      isActive: checked,
                    })
                  }
                />
                <Label>{t("categories.fields.active")}</Label>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="border-gray-200 dark:border-gray-700"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleUpdateCategory}
                  disabled={isLoading}
                  className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                >
                  {isLoading ? t("common.saving") : t("common.save")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
