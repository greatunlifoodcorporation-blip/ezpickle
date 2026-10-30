export const dynamic = "force-dynamic";

/** Used by Railway to know the app has started. Deliberately does not touch the DB. */
export function GET() {
  return Response.json({
    ok: true,
    // Railway fills this in; it lets you check which GitHub commit is live.
    commit: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  });
}
