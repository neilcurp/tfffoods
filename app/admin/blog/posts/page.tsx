"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PenTool, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, FileText } from "lucide-react";

interface MultiLangField {
  en: string;
  "zh-TW": string;
}

interface BlogPost {
  _id: string;
  title: MultiLangField;
  content: MultiLangField;
  excerpt: MultiLangField;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  status: "draft" | "published";
  publishedAt?: string;
  updatedAt: string;
}

export default function BlogPostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language: currentLanguage } = useTranslation();
  const confirm = useConfirm();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.blog"),
      href: "/admin/blog",
      icon: FileText,
    },
    {
      label: t("navigation.posts"),
      href: "/admin/blog/posts",
      icon: FileText,
    },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching posts with session:", session); // Add session logging

        const res = await fetch("/api/blog/posts?admin=true", {
          cache: "no-store",
        });

        const data = await res.json();
        console.log("API Response:", { status: res.status, data }); // Add response logging

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch posts");
        }

        if (!Array.isArray(data.posts)) {
          console.error("Invalid data format:", data); // Add data format error logging
          throw new Error("Invalid posts data format");
        }

        setPosts(data.posts || []);
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch blog posts. Please try again."
        );
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.admin) {
      console.log("Admin user detected, fetching posts"); // Add admin check logging
      fetchPosts();
    } else {
      console.log("Non-admin user or no session:", session?.user); // Add non-admin logging
    }
  }, [session]);

  const handleDelete = async (postId: string) => {
    const confirmed = await confirm({
      title: t("common.delete"),
      description: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/blog/posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");

      setPosts((prev) => prev.filter((post) => post._id !== postId));
      toast.success("Blog post deleted successfully");
    } catch (error) {
      console.error("Failed to delete blog post:", error);
      toast.error("Failed to delete blog post. Please try again.");
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!post?.title) return false;
    const titleEn = post.title.en || "";
    const titleZh = post.title["zh-TW"] || "";
    const searchLower = searchTerm.toLowerCase();
    return (
      titleEn.toLowerCase().includes(searchLower) ||
      titleZh.toLowerCase().includes(searchLower)
    );
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!session?.user?.admin) {
    return <div>{t("common.unauthorized")}</div>;
  }

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
                {t("blog.posts.pageTitle")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t("blog.posts.description")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Input
                type="search"
                placeholder={t("blog.posts.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Button
                asChild
                className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] w-full sm:w-auto"
              >
                <Link href="/admin/blog/create">
                  <PenTool className="h-4 w-4 mr-2" />
                  {t("blog.posts.create")}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
                <span className="animate-pulse">{t("common.loading")}</span>
              </div>
            </div>
          ) : filteredPosts.length > 0 ? (
            <>
              {/* Mobile Grid View (<=640px) */}
              <div className="block sm:hidden">
                <div className="grid grid-cols-1 gap-4 p-4">
                  {filteredPosts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-card/50 rounded-lg shadow p-4 flex flex-col gap-2"
                    >
                      <div className="font-semibold text-lg text-gray-900 dark:text-gray-100 break-all">
                        {post?.title?.[currentLanguage] ||
                          post?.title?.en ||
                          ""}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Author: {post.author?.name || "Unknown"}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span>Status:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            post.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                          }`}
                        >
                          {t(`blog.posts.statusTypes.${post.status}`)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Published:{" "}
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : "-"}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/blog/edit?id=${post._id}`)
                          }
                          className="hover:bg-[#535C91] hover:text-white dark:hover:bg-[#6B74A9] flex-1"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          {t("common.edit")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(post._id)}
                          className="hover:bg-red-600 flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View (>640px) */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("blog.posts.title")}</TableHead>
                      <TableHead>{t("blog.posts.author")}</TableHead>
                      <TableHead>{t("blog.posts.status")}</TableHead>
                      <TableHead>{t("blog.posts.publishedAt")}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => (
                      <TableRow key={post._id}>
                        <TableCell className="font-medium">
                          {post?.title?.[currentLanguage] ||
                            post?.title?.en ||
                            ""}
                        </TableCell>
                        <TableCell>{post.author?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              post.status === "published"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                            }`}
                          >
                            {t(`blog.posts.statusTypes.${post.status}`)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/blog/edit?id=${post._id}`)
                              }
                              className="hover:bg-[#535C91] hover:text-white dark:hover:bg-[#6B74A9]"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              {t("common.edit")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(post._id)}
                              className="hover:bg-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("common.delete")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              {t("blog.posts.noPosts")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
