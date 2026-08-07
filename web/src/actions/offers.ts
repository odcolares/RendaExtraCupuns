"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOfferByIdAction(id: string, tenantId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id, tenantId },
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      platform: true,
      price: true,
      originalPrice: true,
      discount: true,
      imageUrl: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      tenantId: true,
    },
  });

  return offer;
}

export async function updateOfferAction(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    description?: string | null;
    price?: number | null;
    status?: "pending" | "published" | "failed";
  }
) {
  const offer = await prisma.offer.update({
    where: { id, tenantId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  revalidatePath("/ofertas");
  return offer;
}

export async function createOfferAction(
  tenantId: string,
  data: {
    title: string;
    description?: string | null;
    url: string;
    platform: "amazon" | "shopee" | "mercadolivre" | "aliexpress" | "outros";
    price?: number | null;
    originalPrice?: number | null;
    discount?: number | null;
    imageUrl?: string | null;
    status?: "pending" | "published" | "failed";
  }
) {
  const offer = await prisma.offer.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description || null,
      url: data.url,
      platform: data.platform,
      price: data.price ?? null,
      originalPrice: data.originalPrice ?? null,
      discount: data.discount ?? null,
      imageUrl: data.imageUrl || null,
      status: data.status || "pending",
    },
  });

  revalidatePath("/ofertas");
  return offer;
}

export async function deleteOfferAction(id: string, tenantId: string) {
  const result = await prisma.offer.deleteMany({
    where: { id, tenantId },
  });

  revalidatePath("/ofertas");
  return { success: result.count > 0 };
}
