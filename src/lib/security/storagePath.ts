/**
 * Returns a folder-scoped storage path: {userId}/{filename}
 * Required for lab-reports bucket RLS policies.
 */
export function userScopedPath(userId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  const ts = Date.now();
  return `${userId}/${ts}-${safe}`;
}
