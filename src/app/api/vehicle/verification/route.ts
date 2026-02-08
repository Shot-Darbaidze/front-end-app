import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

async function saveFile(file: File, dir: string, namePrefix: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name?.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload";
  const filePath = path.join(dir, `${namePrefix}-${Date.now()}-${safeName}`);
  await writeFile(filePath, bytes);
  return filePath;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const makeModel = String(form.get("makeModel") || "");
    const year = String(form.get("year") || "");
    const license = String(form.get("license") || "");

    const vehiclePhotos = form
      .getAll("vehiclePhotos")
      .filter(Boolean) as File[];
    const insurance = form.get("insurance") as File | null;

    if (!makeModel || !year || !license) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!vehiclePhotos.length || !insurance) {
      return NextResponse.json(
        { ok: false, error: "Files required: photos and insurance" },
        { status: 400 }
      );
    }

    // Prepare destination directory
    const destDir = path.join(process.cwd(), "public", "uploads", "vehicle");
    await mkdir(destDir, { recursive: true });

    const savedPhotos: string[] = [];
    for (const [idx, file] of vehiclePhotos.entries()) {
      const p = await saveFile(file, destDir, `photo-${idx + 1}`);
      // convert to public path
      savedPhotos.push("/uploads/vehicle/" + path.basename(p));
    }

    const insurancePath = await saveFile(insurance, destDir, "insurance");
    const insurancePublic = "/uploads/vehicle/" + path.basename(insurancePath);

    // In a real app we'd persist metadata in DB here
    return NextResponse.json({
      ok: true,
      message: "Vehicle verification submitted",
      data: {
        makeModel,
        year,
        license,
        photos: savedPhotos,
        insurance: insurancePublic,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
