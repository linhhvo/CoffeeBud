/**
 * r2Upload.ts
 *
 * Handles direct-to-R2 uploads from the browser via presigned PUT URLs.
 *
 * Expected backend contract
 * ─────────────────────────
 * POST /api/config/avatars/presign
 * Body:  { mood: string; filename: string; contentType: string }
 * Response:
 *   {
 *     uploadUrl: string;  // R2 presigned PUT URL (short-lived, ~15 min)
 *     objectKey: string;  // The key used when signing, e.g. "avatars/happy/pet.bmp"
 *   }
 *
 * The public URL is assembled here from R2_PUBLIC_BASE_URL + objectKey,
 * so the backend only needs to return the key — not the full public URL.
 *
 * The presigned URL is generated server-side using the AWS S3-compatible SDK
 * pointed at your R2 bucket endpoint.
 */

/** Permanent public base URL for the R2 bucket. */
export const R2_PUBLIC_BASE_URL = "https://coffeebud-assets.linhvo.me";

const apiUrl = import.meta.env.VITE_API_URL;
const PRESIGN_ENDPOINT = `${apiUrl}/pet/avatars/presign`;

export interface PresignResponse {
    upload_url: string;
    object_key: string;
}

/** Assemble the permanent public URL for any object key. */
export function r2PublicUrl(objectKey: string): string {
    return `${R2_PUBLIC_BASE_URL}/${objectKey}`;
}

/** Ask the backend for a short-lived PUT URL for one avatar slot. */
export async function getPresignedUrl(
    mood: string,
): Promise<PresignResponse> {
    const res = await fetch(`${PRESIGN_ENDPOINT}?mood=${mood}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Failed to get presigned URL: ${text}`);
    }

    const json = await res.json();

    return (json.data ?? json) as PresignResponse;
}

export interface UploadProgress {
    /** 0–100 */
    percent: number;
}

/**
 * PUT a File directly to R2 using the presigned URL.
 * Uses XMLHttpRequest so we can report real upload progress.
 */
export function uploadToR2(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                onProgress?.({
                    percent: Math.round((e.loaded / e.total) * 100),
                });
            }
        });

        xhr.addEventListener("load", () => {
            // R2 presigned PUT returns 200 on success
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`R2 upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener(
            "error",
            () => reject(new Error("Network error during R2 upload")),
        );
        xhr.addEventListener(
            "abort",
            () => reject(new Error("R2 upload aborted")),
        );

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "image/bmp");
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.send(file);
    });
}

export async function presignAndUpload(
    mood: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
    const { upload_url, object_key } = await getPresignedUrl(mood);
    console.log(upload_url);
    console.log(object_key);
    await uploadToR2(upload_url, file, onProgress);
    return r2PublicUrl(object_key);
}