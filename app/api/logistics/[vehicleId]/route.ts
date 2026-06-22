import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import connect from "@/utils/config/dbConnection";
import { Logistics } from "@/utils/models/Logistics";
import { ObjectId } from "mongodb";
import type { LogisticsVehicle, VehicleStatus } from "@/types/logistics";

interface Params {
  params: Promise<{
    vehicleId: string;
  }>;
}

interface UpdateData {
  status?: VehicleStatus;
  registrationNo?: string;
  owner?: string;
  makeYear?: number;
  make?: string;
  model?: string;
  chassisNo?: string;
  weight?: number;
  cylinderCapacity?: number;
  bodyType?: string;
  driver?: {
    name: string;
    licenseNo: string;
    contactNo: string;
    email: string;
  };
  assignedLocation?: string;
}

export const dynamic = "force-dynamic";

// Get a single vehicle
export async function GET(
  request: Request,
  { params }: Params
): Promise<NextResponse<LogisticsVehicle | { error: string }>> {
  try {
    const resolvedParams = await params;
    const { vehicleId } = resolvedParams;
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connect();

    const vehicle = await Logistics.findOne({
      _id: new ObjectId(vehicleId),
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json(vehicle as LogisticsVehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a vehicle
export async function PUT(
  request: Request,
  { params }: Params
): Promise<NextResponse<LogisticsVehicle | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connect();

    const { vehicleId } = await params;
    const body = await request.json();
    const updateData: UpdateData = {};

    // Handle both status-only and full vehicle updates
    if (Object.keys(body).length === 1 && body.status) {
      // Status-only update
      updateData.status = body.status as VehicleStatus;
    } else {
      // Full vehicle update
      updateData.registrationNo = body.registrationNo;
      updateData.owner = body.owner;
      updateData.makeYear = parseInt(body.makeYear);
      updateData.make = body.make;
      updateData.model = body.model;
      updateData.chassisNo = body.chassisNo;
      updateData.weight = parseFloat(body.weight);
      updateData.cylinderCapacity = parseInt(body.cylinderCapacity);
      updateData.bodyType = body.bodyType;
      updateData.status = body.status;
      updateData.driver = {
        name: body.driver.name,
        licenseNo: body.driver.licenseNo,
        contactNo: body.driver.contactNo,
        email: body.driver.email,
      };
      updateData.assignedLocation = body.assignedLocation;
    }

    const updatedVehicle = await Logistics.findOneAndUpdate(
      { _id: new ObjectId(vehicleId) },
      { $set: updateData },
      { new: true }
    );

    if (!updatedVehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json(updatedVehicle as LogisticsVehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
