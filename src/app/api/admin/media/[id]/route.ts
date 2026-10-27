import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { assertCsrf } from "@/lib/auth";
import { facilityImageSchema } from "@/lib/validation";
import { route, ok, readJson } from "@/lib/api";
import { audit } from "@/lib/audit";

export const PATCH = route(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  await assertCsrf(request);
  const { id } = await ctx.params;
  await requirePermission("media:write");

  const input = facilityImageSchema.partial().parse(await readJson(request));
  const image = await prisma.facilityImage.update({ where: { id }, data: input });

  return ok({ image });
});

export const DELETE = route(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  await assertCsrf(request);
  const { id } = await ctx.params;
  const admin = await requirePermission("media:write");

  const existing = await prisma.facilityImage.findUnique({ where: { id }, select: { url: true } });
  await prisma.facilityImage.delete({ where: { id } });

  // Remove the stored file too if this image was an upload.
  const uploaded = existing?.url.match(/^\/api\/files\/([a-z0-9]+)$/i);
  if (uploaded) await prisma.uploadedFile.deleteMany({ where: { id: uploaded[1] } });
  await audit({
    userId: admin.id,
    actorEmail: admin.email,
    action: "media.delete",
    entity: "FacilityImage",
    entityId: id,
  });

  return ok({ removed: true });
});
