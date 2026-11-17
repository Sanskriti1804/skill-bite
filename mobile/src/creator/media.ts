import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

export type PickedVideoMeta = {
  uri: string;
  mimeType: string;
  fileName: string;
  durationSeconds: number;
};

export type PickedVideo = PickedVideoMeta & {
  dataBase64: string;
};

export async function pickShortVideoFromGallery(): Promise<PickedVideoMeta | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Media library permission is required to upload a tutorial.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    quality: 0.8,
    videoMaxDuration: 180,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const durationSeconds = Math.max(1, Math.round((asset.duration ?? 60000) / 1000));
  return {
    uri: asset.uri,
    mimeType: asset.mimeType || "video/mp4",
    fileName: asset.fileName ?? "tutorial.mp4",
    durationSeconds,
  };
}

export async function encodeVideoBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}

export async function pickShortVideo(): Promise<PickedVideo | null> {
  const meta = await pickShortVideoFromGallery();
  if (!meta) return null;
  const dataBase64 = await encodeVideoBase64(meta.uri);
  return { ...meta, dataBase64 };
}
