#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const androidDir = path.join(projectRoot, "android");
const easJsonPath = path.join(projectRoot, "eas.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(androidDir)) {
  fail("Missing android directory. Run `pnpm exec expo prebuild --platform android` first.");
}

if (!fs.existsSync(easJsonPath)) {
  fail("Missing apps/mobile/eas.json.");
}

const profile = process.argv[2] ?? "preview";
const gradleTask = process.argv[3] ?? "assembleRelease";

const easConfig = JSON.parse(fs.readFileSync(easJsonPath, "utf8"));
const buildProfile = easConfig?.build?.[profile];

if (!buildProfile) {
  fail(`Unknown EAS build profile: ${profile}`);
}

const profileEnv = buildProfile.env ?? {};
const mergedEnv = {
  ...process.env,
  ...profileEnv,
  EAS_BUILD_PROFILE: profile,
};

console.log(`[gradle-with-eas-env] profile=${profile} task=${gradleTask}`);
console.log("[gradle-with-eas-env] applied env keys:", Object.keys(profileEnv).join(", "));

const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const child = spawn(gradlew, [gradleTask], {
  cwd: androidDir,
  env: mergedEnv,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
