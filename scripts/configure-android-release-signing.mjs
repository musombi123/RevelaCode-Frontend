#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const gradlePath = resolve("android/app/build.gradle");
const keystorePath = String(process.env.ANDROID_KEYSTORE_PATH || "").trim();
if (!keystorePath) throw new Error("ANDROID_KEYSTORE_PATH is required to configure release signing.");

let source = await readFile(gradlePath, "utf8");
if (!/\bbuildTypes\s*\{\s*release\s*\{/.test(source)) {
  throw new Error("Could not locate the generated Android release build type.");
}

const signingBlock = `
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }

`;

if (!/\bsigningConfigs\s*\{/.test(source)) {
  source = source.replace(/(^\s*)buildTypes\s*\{/m, signingBlock + "$1buildTypes {");
}
if (!/buildTypes\s*\{\s*release\s*\{[\s\S]{0,180}signingConfig\s+signingConfigs\.release/.test(source)) {
  source = source.replace(
    /(buildTypes\s*\{\s*release\s*\{)/,
    "$1\n            signingConfig signingConfigs.release",
  );
}
await writeFile(gradlePath, source, "utf8");
console.log("Configured release signing from protected runner environment variables.");
