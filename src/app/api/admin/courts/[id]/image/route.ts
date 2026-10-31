import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { assertCsrf } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { Errors } from "@/lib/errors";
import { saveUploadedImage, deleteUploadedByUrl } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Replaces the court's photo with the uploaded file. */
export const POST = route(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  await assertCsrf(request);
  await requirePermission("court:write");
  const { id } = await ctx.params;

  const court = await prisma.court.findUnique({ where: { id }, include: { images: true } });
  if (!court) throw Errors.notFound("That court");

  const url = await saveUploadedImage(request);

  await prisma.courtImage.deleteMany({ where: { courtId: id } });
  await prisma.courtImage.create({
    data: { courtId: id, url, title: court.name, sortOrder: 0, featured: true },
  });
  for (const old of court.images) await deleteUploadedByUrl(old.url);

  return ok({ url }, { status: 201 });
});

/** Removes the court's photo. */
export const DELETE = route(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  await assertCsrf(request);
  await requirePermission("court:write");
  const { id } = await ctx.params;

  const images = await prisma.courtImage.findMany({ where: { courtId: id } });
  await prisma.courtImage.deleteMany({ where: { courtId: id } });
  for (const old of images) await deleteUploadedByUrl(old.url);

  return ok({ removed: true });
});
