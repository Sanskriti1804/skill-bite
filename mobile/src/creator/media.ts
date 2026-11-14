import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

export type PickedVideo = {
  uri: string;
  mimeType: string;
  fileName: string;
  dataBase64: string;
  durationSeconds: number;
};

export async function pickShortVideo(): Promise<PickedVideo | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Media library permission is required to upload a tutorial.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    quality: 0.8,
    videoMaxDuration: 180,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const dataBase64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: "base64",
  });
  const durationSeconds = Math.max(1, Math.round((asset.duration ?? 60000) / 1000));
  return {
    uri: asset.uri,
    mimeType: asset.mimeType || "video/mp4",
    fileName: asset.fileName ?? "tutorial.mp4",
    dataBase64,
    durationSeconds,
  };
}
