import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import Vehicle from "@/utils/models/Vehicle";
import dbConnect from "@/utils/config/dbConnection";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { vehicleId } = await params;

    await dbConnect();

    const { date, description, cost, nextMaintenanceDate } =
      await request.json();

    // Validate required fields
    if (!date || !description || !cost || !nextMaintenanceDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Find and update the vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return new NextResponse("Vehicle not found", { status: 404 });
    }

    // Add the new maintenance record
    vehicle.maintenanceRecords.push({
      date: new Date(date),
      description,
      cost: parseFloat(cost),
      nextMaintenanceDate: new Date(nextMaintenanceDate),
    });

    // Save the updated vehicle
    await vehicle.save();

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
