import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api-bookings.sa.gov.ge/api/v1/DrivingLicensePracticalExams2";
const DATES_URL = `${BASE_URL}/DrivingLicenseExamsDates2`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryCode = searchParams.get("CategoryCode");
    const centerId = searchParams.get("CenterId");

    if (!categoryCode || !centerId) {
      return NextResponse.json(
        { error: "Missing required parameters: CategoryCode and CenterId" },
        { status: 400 }
      );
    }

    // Build the external API URL with parameters
    const externalParams = new URLSearchParams({
      CategoryCode: categoryCode,
      CenterId: centerId,
    });

    const externalUrl = `${DATES_URL}?${externalParams.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(externalUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "ka",
        Origin: "https://my.sa.gov.ge",
        Referer: "https://my.sa.gov.ge/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Exam upstream returned ${response.status}: ${errorText}`);
      // Fail soft to keep monitor polling alive even when upstream is flaky.
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("Exam slots API upstream unreachable:", message);
    // Fail soft so frontend does not throw API 500 while upstream is unreachable.
    return NextResponse.json([], { status: 200 });
  }
}
