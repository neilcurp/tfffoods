import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import connect from "@/utils/config/dbConnection";
import User from "@/utils/models/User";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    await connect();
    const body = await request.json();
    const { role, admin } = body;

    const user = await User.findByIdAndUpdate(
      id,
      { role, admin },
      { new: true }
    ).select("-password");

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id } = await params;

    // Don't allow deleting your own account
    if (id === session.user._id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400 }
      );
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return new Response(JSON.stringify({ error: "Failed to delete user" }), {
      status: 500,
    });
  }
}
