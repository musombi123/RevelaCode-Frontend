import { Capacitor, registerPlugin } from "@capacitor/core";

const RevelaPermissions = registerPlugin("RevelaPermissions");

export const isNativeAndroid = () => Capacitor.getPlatform() === "android";

export async function checkDevicePermissions() {
  if (!isNativeAndroid()) return null;
  return RevelaPermissions.checkPermissions();
}

const permissionMethods = {
  camera: "requestCamera",
  location: "requestLocation",
  microphone: "requestMicrophone",
  notifications: "requestNotifications",
};

export async function requestDevicePermission(permission) {
  if (!isNativeAndroid()) return null;
  const method = permissionMethods[permission];
  if (!method) throw new Error("Unsupported device permission: " + permission);
  return RevelaPermissions[method]();
}

export async function openDeviceAppSettings() {
  if (!isNativeAndroid()) return;
  return RevelaPermissions.openAppSettings();
}
