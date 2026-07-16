import { NextRequest, NextResponse } from "next/server";
import { createServerAdapter } from "@/lib/http/serverAdapter";
import { FALLBACK_LOCALE } from "@/lib/locales";
import { ApiError } from "@/lib/errors";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function handle(
    request: NextRequest,
    ctx: { params: Promise<{ path: string[] }> },
    method: Method
) {
    const { path } = await ctx.params;
    const resourcePath = `/${path.join("/")}`;

    // Forward Accept-Language từ browser request — không dùng getLocale()
    // vì URL /api/proxy/... không có locale prefix nên getLocale() trả về fallback.
    const locale = request.headers.get("Accept-Language") ?? FALLBACK_LOCALE;
    const adapter = createServerAdapter(locale);

    let payload: unknown;
    // GET + DELETE truyền params qua query string (không có body).
    // POST/PUT/PATCH truyền qua body (JSON hoặc FormData).
    if (method === "GET" || method === "DELETE") {
        payload = Object.fromEntries(request.nextUrl.searchParams.entries());
    } else {
        const contentType = request.headers.get("content-type") ?? "";
        payload = contentType.includes("multipart/form-data")
            ? await request.formData()
            : await request.json().catch(() => undefined);
    }

    try {
        let result: unknown;
        switch (method) {
            case "GET": result = await adapter.get(resourcePath, payload as Record<string, unknown>); break;
            case "POST": result = await adapter.post(resourcePath, payload); break;
            case "PUT": result = await adapter.put(resourcePath, payload); break;
            case "PATCH": result = await adapter.patch(resourcePath, payload); break;
            case "DELETE": result = await adapter.delete(resourcePath, payload as Record<string, unknown>); break;
        }
        return NextResponse.json(result);
    } catch (err) {
        if (err instanceof ApiError) {
            return NextResponse.json(
                { success: false, message: err.message, code: err.code, errors: err.errors },
                { status: err.status }
            );
        }
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    return handle(request, ctx, "GET");
}
export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    return handle(request, ctx, "POST");
}
export async function PUT(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    return handle(request, ctx, "PUT");
}
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    return handle(request, ctx, "PATCH");
}
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    return handle(request, ctx, "DELETE");
}
