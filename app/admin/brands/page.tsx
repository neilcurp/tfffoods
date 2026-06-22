"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { IBrand } from "@/utils/models/Brand";
import { shouldShowBrandAdmin } from "@/utils/config/featureFlags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { numberInputDisplay, parseNumberInput } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  MultiLangInput,
  MultiLangDisplay,
} from "@/components/MultiLangInput/index";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NewBrand {
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
  order: number;
}

interface EditableBrand {
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
  isActive: boolean;
}

export default function BrandsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language, t } = useTranslation();
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<EditableBrand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<EditableBrand | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [newBrand, setNewBrand] = useState<NewBrand>({
    name: "",
    displayNames: { en: "", "zh-TW": "" },
    descriptions: { en: "", "zh-TW": "" },
    isActive: true,
    order: 0,
  });

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: null, // Removed LayoutDashboard as per edit hint
    },
    {
      label: t("navigation.brands"),
      href: "/admin/brands",
      icon: null, // Removed Tag as per edit hint
    },
  ];

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/brands");
      // Set brands directly from response.data since it's already an array
      setBrands(response.data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error(
        language === "en" ? "Failed to fetch brands" : "獲取品牌失敗"
      );
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (!shouldShowBrandAdmin()) {
      router.push("/admin");
      return;
    }

    if (status === "authenticated" && !session?.user?.admin) {
      toast.error("Unauthorized: Admin access required");
      router.push("/");
      return;
    }

    if (status === "authenticated" && session?.user?.admin) {
      fetchBrands();
    }
  }, [status, session, router, fetchBrands]);

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

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!newBrand.displayNames.en && !newBrand.displayNames["zh-TW"]) {
      toast.error(
        language === "en" ? "Brand name is required" : "品牌名稱為必填項"
      );
      return;
    }

    try {
      // Generate name and slug from displayNames
      const name = generateInternalName(
        newBrand.displayNames.en || newBrand.displayNames["zh-TW"]
      );
      const slug = name; // Use the same format for slug

      // Prepare brand data
      const brandData = {
        name,
        slug,
        displayNames: {
          en: newBrand.displayNames.en || "",
          "zh-TW": newBrand.displayNames["zh-TW"] || "",
        },
        descriptions: {
          en: newBrand.descriptions.en || "",
          "zh-TW": newBrand.descriptions["zh-TW"] || "",
        },
        isActive: Boolean(newBrand.isActive),
        order: Number(newBrand.order) || 0,
        products: [],
      };

      console.log("Creating brand with data:", brandData);

      const response = await axios.post("/api/admin/brands", brandData);

      console.log("Brand created successfully:", response.data);

      // Update the brands list with the new brand
      setBrands([...brands, response.data]);

      // Close modal and reset form
      setShowCreateModal(false);
      setNewBrand({
        name: "",
        displayNames: { en: "", "zh-TW": "" },
        descriptions: { en: "", "zh-TW": "" },
        isActive: true,
        order: 0,
      });

      toast.success(
        language === "en" ? "Brand created successfully" : "品牌創建成功"
      );
    } catch (error: any) {
      console.error("Error creating brand:", {
        error,
        response: error.response,
        data: error.response?.data,
        message: error.message,
        stack: error.stack,
      });

      toast.error(
        language === "en"
          ? error.response?.data?.error || "Failed to create brand"
          : "品牌創建失敗"
      );
    }
  };

  const handleEditBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    try {
      const response = await axios.put(`/api/admin/brands`, {
        id: editingBrand._id,
        displayNames: editingBrand.displayNames,
        descriptions: editingBrand.descriptions,
        isActive: editingBrand.isActive,
        order: editingBrand.order,
      });

      // Update the brands list with the edited brand
      setBrands(
        brands.map((brand) =>
          brand._id === editingBrand._id ? response.data : brand
        )
      );

      setShowEditModal(false);
      setEditingBrand(null);
      toast.success(
        language === "en" ? "Brand updated successfully" : "品牌更新成功"
      );
    } catch (error) {
      console.error("Error updating brand:", error);
      toast.error(
        language === "en" ? "Failed to update brand" : "品牌更新失敗"
      );
    }
  };

  const toggleBrandStatus = async (brand: IBrand) => {
    try {
      const response = await axios.put(`/api/admin/brands`, {
        id: brand._id,
        isActive: !brand.isActive,
      });

      // Update the brands list with the updated brand
      setBrands(brands.map((b) => (b._id === brand._id ? response.data : b)));

      toast.success(
        language === "en"
          ? `Brand ${
              response.data.isActive ? "activated" : "deactivated"
            } successfully`
          : `品牌${response.data.isActive ? "啟用" : "停用"}成功`
      );
    } catch (error) {
      console.error("Error toggling brand status:", error);
      toast.error(
        language === "en" ? "Failed to update brand status" : "更新品牌狀態失敗"
      );
    }
  };

  const handleDeleteBrand = async () => {
    if (!deletingBrand) return;

    try {
      await axios.delete(`/api/admin/brands`, {
        data: { id: deletingBrand._id },
      });

      // Remove the brand from local state
      setBrands(brands.filter((brand) => brand._id !== deletingBrand._id));

      setShowDeleteModal(false);
      setDeletingBrand(null);
      toast.success(
        language === "en" ? "Brand deleted successfully" : "品牌刪除成功"
      );
    } catch (error: any) {
      console.error("Error deleting brand:", {
        error,
        response: error.response,
        data: error.response?.data,
        message: error.message,
      });
      toast.error(
        language === "en"
          ? error.response?.data?.error || "Failed to delete brand"
          : "品牌刪除失敗"
      );
    }
  };

  const handleEditClick = (brand: IBrand) => {
    setEditingBrand({
      _id: brand._id.toString(),
      name: brand.name,
      displayNames: brand.displayNames || { en: "", "zh-TW": "" },
      descriptions: brand.descriptions || { en: "", "zh-TW": "" },
      isActive: brand.isActive,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (brand: IBrand) => {
    setDeletingBrand({
      _id: brand._id.toString(),
      name: brand.name,
      displayNames: brand.displayNames || { en: "", "zh-TW": "" },
      descriptions: brand.descriptions || { en: "", "zh-TW": "" },
      isActive: brand.isActive,
    });
    setShowDeleteModal(true);
  };

  // Function to generate internal reference name from display name
  const generateInternalName = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
      .trim()
      .replace(/\s+/g, "-"); // Replace spaces with hyphens
  };

  // Update newBrand when display name changes
  const handleDisplayNameChange = (value: { en: string; "zh-TW": string }) => {
    const internalName = generateInternalName(value.en || value["zh-TW"]);
    setNewBrand({
      ...newBrand,
      name: internalName,
      displayNames: value,
    });
  };

  if (loading) {
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
                {language === "en" ? "Brand Management" : "品牌管理"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {language === "en"
                  ? "Manage your product brands"
                  : "管理您的產品品牌"}
              </p>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {language === "en" ? "Add Brand" : "新增品牌"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {language === "en" ? "Add Brand" : "新增品牌"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBrand}>
                  <div className="space-y-4">
                    <MultiLangInput
                      label={language === "en" ? "Brand Name" : "品牌名稱"}
                      value={newBrand.displayNames}
                      onChange={handleDisplayNameChange}
                      placeholder={{
                        en: "Brand name in English",
                        "zh-TW": "品牌名稱",
                      }}
                    />
                    <MultiLangInput
                      label={language === "en" ? "Description" : "描述"}
                      type="textarea"
                      value={newBrand.descriptions}
                      onChange={(value) =>
                        setNewBrand({ ...newBrand, descriptions: value })
                      }
                      placeholder={{
                        en: "Brand description in English",
                        "zh-TW": "品牌描述",
                      }}
                    />
                    <div>
                      <Label>
                        {language === "en" ? "Display Order" : "顯示順序"}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={numberInputDisplay(newBrand.order)}
                        onChange={(e) =>
                          setNewBrand({
                            ...newBrand,
                            order: parseNumberInput(e.target.value),
                          })
                        }
                        placeholder={
                          language === "en"
                            ? "Enter display order"
                            : "輸入顯示順序"
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={newBrand.isActive}
                        onCheckedChange={(checked) =>
                          setNewBrand({ ...newBrand, isActive: checked })
                        }
                      />
                      <Label htmlFor="active">
                        {language === "en" ? "Active" : "啟用"}
                      </Label>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit">
                      {language === "en" ? "Create Brand" : "建立品牌"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {brands.length === 0 ? (
          <div className="text-center py-10 bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 mt-6">
            {t("brands.list.empty")}
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 mt-6">
            {/* Mobile Grid View */}
            <div className="block md:hidden">
              <div className="grid grid-cols-1 gap-4 p-4">
                {brands.map((brand) => (
                  <div
                    key={brand._id.toString()}
                    className="bg-card border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        <MultiLangDisplay
                          value={brand.displayNames}
                          currentLang={language === "en" ? "en" : "zh-TW"}
                        />
                      </h3>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={brand.isActive}
                          onCheckedChange={() => toggleBrandStatus(brand)}
                        />
                        <span
                          className={`text-sm ${
                            brand.isActive ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {brand.isActive
                            ? language === "en"
                              ? "Active"
                              : "啟用"
                            : language === "en"
                            ? "Inactive"
                            : "停用"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(brand)}
                      >
                        {language === "en" ? "Edit" : "編輯"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(brand)}
                      >
                        {language === "en" ? "Delete" : "刪除"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      {language === "en" ? "Brand Name" : "品牌名稱"}
                    </TableHead>
                    <TableHead className="w-[400px]">
                      {language === "en" ? "Description" : "描述"}
                    </TableHead>
                    <TableHead className="w-[150px] text-right">
                      {language === "en" ? "Status" : "狀態"}
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      {language === "en" ? "Actions" : "操作"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand._id.toString()}>
                      <TableCell className="w-[200px]">
                        <MultiLangDisplay
                          value={brand.displayNames}
                          currentLang={language === "en" ? "en" : "zh-TW"}
                        />
                      </TableCell>
                      <TableCell className="w-[400px]">
                        <MultiLangDisplay
                          value={brand.descriptions}
                          currentLang={language === "en" ? "en" : "zh-TW"}
                        />
                      </TableCell>
                      <TableCell className="w-[150px]">
                        <div className="flex items-center justify-end space-x-2">
                          <Switch
                            checked={brand.isActive}
                            onCheckedChange={() => toggleBrandStatus(brand)}
                          />
                          <span
                            className={
                              brand.isActive
                                ? "text-green-500"
                                : "text-gray-500"
                            }
                          >
                            {brand.isActive
                              ? language === "en"
                                ? "Active"
                                : "啟用"
                              : language === "en"
                              ? "Inactive"
                              : "停用"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px] text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(brand)}
                          >
                            {language === "en" ? "Edit" : "編輯"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(brand)}
                          >
                            {language === "en" ? "Delete" : "刪除"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Edit Brand Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "en" ? "Edit Brand" : "編輯品牌"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditBrand}>
              <div className="space-y-4">
                <MultiLangInput
                  label={language === "en" ? "Brand Name" : "品牌名稱"}
                  value={editingBrand?.displayNames || { en: "", "zh-TW": "" }}
                  onChange={(value) =>
                    setEditingBrand(
                      editingBrand
                        ? { ...editingBrand, displayNames: value }
                        : null
                    )
                  }
                  placeholder={{
                    en: "Brand name in English",
                    "zh-TW": "品牌名稱",
                  }}
                />
                <MultiLangInput
                  label={language === "en" ? "Description" : "描述"}
                  type="textarea"
                  value={editingBrand?.descriptions || { en: "", "zh-TW": "" }}
                  onChange={(value) =>
                    setEditingBrand(
                      editingBrand
                        ? { ...editingBrand, descriptions: value }
                        : null
                    )
                  }
                  placeholder={{
                    en: "Brand description in English",
                    "zh-TW": "品牌描述",
                  }}
                />
                <div>
                  <Label>
                    {language === "en" ? "Display Order" : "顯示順序"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={numberInputDisplay(editingBrand?.order)}
                    onChange={(e) =>
                      setEditingBrand(
                        editingBrand
                          ? {
                              ...editingBrand,
                              order: parseNumberInput(e.target.value),
                            }
                          : null
                      )
                    }
                    placeholder={
                      language === "en" ? "Enter display order" : "輸入顯示順序"
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active-edit"
                    checked={editingBrand?.isActive || false}
                    onCheckedChange={(checked) =>
                      setEditingBrand(
                        editingBrand
                          ? { ...editingBrand, isActive: checked }
                          : null
                      )
                    }
                  />
                  <Label htmlFor="active-edit">
                    {language === "en" ? "Active" : "啟用"}
                  </Label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit">
                  {language === "en" ? "Save Changes" : "保存更改"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Brand Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "en"
                  ? "Are you sure you want to delete this brand?"
                  : "確定要刪除這個品牌嗎？"}
              </DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                {language === "en" ? "Cancel" : "取消"}
              </Button>
              <Button variant="destructive" onClick={handleDeleteBrand}>
                {language === "en" ? "Delete" : "刪除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
