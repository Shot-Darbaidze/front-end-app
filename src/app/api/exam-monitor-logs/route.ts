/* ================================================================
   🚨 TEMPORARY API ROUTE — DELETE WHEN NO LONGER NEEDED 🚨
   Proxies the public R2 exam monitor log file to avoid CORS issues.
   To remove: Delete this entire folder:
     src/app/api/exam-monitor-logs/
   ================================================================ */

import { NextRequest, NextResponse } from "next/server";

const R2_PUBLIC_BASE = "https://pub-3dfd12c5fa9d40069445cd407dfc0481.r2.dev";
const LOG_FOLDER = "exam-monitor-logs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Missing or invalid 'date' param (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const url = `${R2_PUBLIC_BASE}/${LOG_FOLDER}/${date}.json`;

  try {
    const resp = await fetch(url, { cache: "no-store" });

    if (resp.status === 404) {
      return NextResponse.json([], { status: 200 });
    }

    if (!resp.ok) {
      return NextResponse.json(
        { error: `R2 returned ${resp.status}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
