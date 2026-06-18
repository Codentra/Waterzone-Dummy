/**
 * Upload a local file URI to Convex storage.
 */
export async function uploadFileToConvex(
  generateUploadUrl: () => Promise<string>,
  uri: string,
  mimeType = "image/jpeg"
): Promise<string> {
  const blob = await fetch(uri).then((r) => r.blob());
  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": mimeType || blob.type || "application/octet-stream" },
    body: blob,
  });
  if (!response.ok) {
    throw new Error("Upload failed");
  }
  const { storageId } = (await response.json()) as { storageId: string };
  return storageId;
}
