import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const backendUrl = `${baseUrl}/api/posts/search${search}`;

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: request.headers.get("authorization") || "",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { message: "Upstream API request failed" },
      { status: 502 }
    );
  }
}
