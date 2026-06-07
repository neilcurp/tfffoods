import { Suspense } from "react";
import { BlogPostEditor } from "./BlogPostEditor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ action: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function BlogPostPage(props: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.admin) {
    redirect("/login");
  }

  // Await both params and searchParams
  const { action } = await props.params;
  const { id } = await props.searchParams;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogPostEditor action={action} id={id} />
    </Suspense>
  );
}
