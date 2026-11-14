import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import type { AppConfig } from "./config.js";

export const CLOUDINARY_REF_PREFIX = "cloudinary:";

export interface MediaStorage {
  saveVideo(contentId: string, bytes: Buffer): Promise<string>;
  read(reference: string): Promise<Buffer>;
}

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

export function localMediaStorage(root: string): MediaStorage {
  return {
    async saveVideo(contentId: string, bytes: Buffer): Promise<string> {
      await mkdir(root, { recursive: true });
      const reference = path.join(contentId, "video.bin");
      const target = path.join(root, reference);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, bytes);
      return reference.replaceAll("\\", "/");
    },
    async read(reference: string): Promise<Buffer> {
      const rootPath = path.resolve(root);
      const target = path.resolve(rootPath, reference);
      const relative = path.relative(rootPath, target);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error("invalid reference");
      }
      return readFile(target);
    },
  };
}

export function cloudinaryMediaStorage(config: CloudinaryConfig): MediaStorage {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return {
    async saveVideo(contentId: string, bytes: Buffer): Promise<string> {
      const publicId = `${config.folder}/${contentId}`.replaceAll(/\/+/g, "/");
      await new Promise<void>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            public_id: publicId,
            overwrite: true,
            invalidate: true,
          },
          (error, result) => {
            if (error || !result?.public_id) {
              reject(error ?? new Error("Cloudinary upload failed"));
              return;
            }
            resolve();
          },
        );
        stream.end(bytes);
      });
      return `${CLOUDINARY_REF_PREFIX}${publicId}`;
    },
    async read(reference: string): Promise<Buffer> {
      if (!reference.startsWith(CLOUDINARY_REF_PREFIX)) {
        throw new Error("invalid cloudinary reference");
      }
      const publicId = reference.slice(CLOUDINARY_REF_PREFIX.length);
      const url = cloudinary.url(publicId, {
        resource_type: "video",
        secure: true,
        sign_url: true,
      });
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Cloudinary media missing");
      }
      return Buffer.from(await response.arrayBuffer());
    },
  };
}

export function cloudinaryConfigFromEnv(config: AppConfig): CloudinaryConfig | null {
  const cloudName = config.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = config.CLOUDINARY_API_KEY?.trim();
  const apiSecret = config.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: (config.CLOUDINARY_FOLDER?.trim() || "skillbite").replace(/^\/+|\/+$/g, ""),
  };
}

/** Prefer Cloudinary when credentials are set; keep local reads for older references. */
export function createMediaStorage(config: AppConfig): MediaStorage {
  const local = localMediaStorage(config.MEDIA_ROOT);
  const cloudinaryCfg = cloudinaryConfigFromEnv(config);
  if (!cloudinaryCfg) return local;
  const remote = cloudinaryMediaStorage(cloudinaryCfg);
  return {
    async saveVideo(contentId: string, bytes: Buffer): Promise<string> {
      return remote.saveVideo(contentId, bytes);
    },
    async read(reference: string): Promise<Buffer> {
      if (reference.startsWith(CLOUDINARY_REF_PREFIX)) {
        return remote.read(reference);
      }
      return local.read(reference);
    },
  };
}
