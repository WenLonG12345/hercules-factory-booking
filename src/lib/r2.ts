import "server-only";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const publicBase = process.env.R2_PUBLIC_BASE_URL;

function client() {
  if (!accountId || !bucket || !publicBase) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_BASE_URL.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export async function uploadImage(file: File, prefix: string) {
  const s3 = client();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `${prefix}/${crypto.randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type || "image/jpeg",
    }),
  );

  return `${publicBase?.replace(/\/$/, "")}/${key}`;
}

export async function deleteImage(url: string) {
  if (!publicBase || !url.startsWith(publicBase)) return;
  const key = url.slice(publicBase.replace(/\/$/, "").length + 1);
  if (!key) return;

  await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
