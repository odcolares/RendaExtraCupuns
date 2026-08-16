import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionKey } from "@/lib/click-redirect";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const sessionKey = getOrCreateSessionKey(request.cookies.get("_rec")?.value);

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { url: true, tenantId: true },
  });

  if (!offer) {
    const res = NextResponse.redirect(new URL("/", request.url));
    res.cookies.set("_rec", sessionKey, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 31536000,
      path: "/",
    });
    return res;
  }

  try {
    await prisma.click.create({
      data: { offerId, tenantId: offer.tenantId, sessionKey },
    });
  } catch (e) {
    console.error("click insert failed", e);
  }

  const res = NextResponse.redirect(offer.url, 302);
  res.cookies.set("_rec", sessionKey, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 31536000,
    path: "/",
  });
  return res;
}