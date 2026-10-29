import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface MediaStorage {
  saveVideo(contentId: string, bytes: Buffer): Promise<string>;
  read(reference: string): Promise<Buffer>;
}

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
      const normalized = path.normalize(reference);
      if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
        throw new Error("invalid reference");
      }
      return readFile(path.join(root, normalized));
    },
  };
}
