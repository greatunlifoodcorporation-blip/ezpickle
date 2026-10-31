import { requirePermission } from "@/lib/guard";
import { assertCsrf } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { saveUploadedImage } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (request: Request) => {
  await assertCsrf(request);
  await requirePermission("media:write");
  const url = await saveUploadedImage(request);
  return ok({ url }, { status: 201 });
});
