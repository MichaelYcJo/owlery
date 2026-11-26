// The package command's decisions: the way of signing the variables give,
// the check of a release's tag against the app's version, the configuration
// the packager is handed, the images of the icon file, and the Dock's image
// of a packaged app. No case runs the packager: a run downloads Electron's
// archive and takes many seconds, so `package` and `package:verify` are
// recorded runs of the phase that built them.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dockImage } from "../src/main/dock-image";
import { BUNDLE_ID, checkTag, iconImages, packageApp, packagerConfig, SIGNING_VARIABLES, signingWay } from "../src/package/package";

/** Each of the five variables, set to text. */
const ALL = Object.fromEntries(SIGNING_VARIABLES.map((name) => [name, `${name}-value`]));

describe("signingWay", () => {
  it("names the five variables of the installed packager", () => {
    expect(SIGNING_VARIABLES).toEqual(["CSC_LINK", "CSC_KEY_PASSWORD", "APPLE_API_KEY", "APPLE_API_KEY_ID", "APPLE_API_ISSUER"]);
  });

  it("signs ad hoc where none of the variables is set", () => {
    expect(signingWay({ PATH: "/usr/bin" })).toBe("ad-hoc");
  });

  it("signs ad hoc where each variable is set and empty, as GitHub gives a secret that is not set", () => {
    expect(signingWay(Object.fromEntries(SIGNING_VARIABLES.map((name) => [name, ""])))).toBe("ad-hoc");
  });

  it("signs with the Developer ID certificate and notarizes where all five hold text", () => {
    expect(signingWay(ALL)).toBe("developer-id");
  });

  it("refuses where only some hold text, and names each one that is missing", () => {
    const env = { ...ALL, CSC_KEY_PASSWORD: "", APPLE_API_ISSUER: undefined };
    expect(() => signingWay(env)).toThrow(
      "Only some of the signing variables are set. Missing: CSC_KEY_PASSWORD, APPLE_API_ISSUER. Set all five to sign with the Developer ID certificate and notarize, or none to sign ad hoc.",
    );
  });

  it("refuses where one alone holds text, and names the other four", () => {
    expect(() => signingWay({ APPLE_API_KEY_ID: "id" })).toThrow("Missing: CSC_LINK, CSC_KEY_PASSWORD, APPLE_API_KEY, APPLE_API_ISSUER.");
  });
});

describe("checkTag", () => {
  it.each(["v0.1.0", "v0.1.0-rc.1", "v0.1.0-package.1"])("lets %s through for version 0.1.0", (tag) => {
    expect(() => checkTag(tag, "0.1.0")).not.toThrow();
  });

  it.each(["v0.1.1", "0.1.0", "v0.1", "v0.1.0.1", "release-0.1.0"])("refuses %s for version 0.1.0, naming the tag and the version", (tag) => {
    expect(() => checkTag(tag, "0.1.0")).toThrow(`The tag ${tag} is not the app's version 0.1.0.`);
  });
});

describe("packageApp", () => {
  /** A folder that holds the app's package.json alone, so a build started in it fails with a sentence of its own. */
  const bare = (): string => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-package-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ version: "0.1.0" }));
    return dir;
  };
  const packager = (): Promise<string[]> => Promise.reject(new Error("the packager ran"));

  it("refuses a tag that is not the app's version before it builds anything", async () => {
    const dir = bare();
    try {
      await expect(packageApp(dir, {}, packager, () => {}, "v0.1.1")).rejects.toThrow("The tag v0.1.1 is not the app's version 0.1.0.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses only some of the signing variables before it builds anything", async () => {
    const dir = bare();
    try {
      await expect(packageApp(dir, { CSC_LINK: "certificate" }, packager, () => {}, "v0.1.0")).rejects.toThrow("Only some of the signing variables are set.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("packagerConfig", () => {
  const ICNS = "/tmp/icon/Owlery.icns";

  it("hands the packager the app as a folder, built as the probe built it", () => {
    const config = packagerConfig("ad-hoc", ICNS);
    expect(config).toMatchObject({
      appId: BUNDLE_ID,
      productName: "Owlery",
      asar: false,
      npmRebuild: false,
      directories: { output: "out" },
      files: ["dist/**", "package.json"],
      dmg: { artifactName: "Owlery-arm64.dmg" },
    });
    expect(config.mac).toMatchObject({ category: "public.app-category.developer-tools", icon: ICNS, hardenedRuntime: true });
    expect(config.mac.target).toEqual([{ target: "dmg", arch: ["arm64"] }]);
  });

  it("writes the product name Owlery into the package's package.json, which Electron names the app and its user data folder by, apart from an app started from a checkout", () => {
    expect(packagerConfig("ad-hoc", ICNS).extraMetadata).toEqual({ productName: "Owlery" });
    expect(packagerConfig("developer-id", ICNS).extraMetadata).toEqual({ productName: "Owlery" });
  });

  it("keeps the bundle identifier of the owner's default", () => {
    expect(BUNDLE_ID).toBe("app.owlery.desktop");
  });

  it("signs ad hoc by naming the identity `-`, so no certificate of the keychain is used, and does not notarize", () => {
    const { mac } = packagerConfig("ad-hoc", ICNS);
    expect(mac.identity).toBe("-");
    expect(mac.notarize).toBe(false);
  });

  it("names no identity in the Developer ID way, so the packager takes the certificate of CSC_LINK, and notarizes", () => {
    const { mac } = packagerConfig("developer-id", ICNS);
    expect("identity" in mac).toBe(false);
    expect(mac.notarize).toBe(true);
  });
});

describe("iconImages", () => {
  it("lists the ten images iconutil reads, each at its pixels", () => {
    expect(iconImages().map(({ name, pixels }) => [name, pixels])).toEqual([
      ["icon_16x16.png", 16],
      ["icon_16x16@2x.png", 32],
      ["icon_32x32.png", 32],
      ["icon_32x32@2x.png", 64],
      ["icon_128x128.png", 128],
      ["icon_128x128@2x.png", 256],
      ["icon_256x256.png", 256],
      ["icon_256x256@2x.png", 512],
      ["icon_512x512.png", 512],
      ["icon_512x512@2x.png", 1024],
    ]);
  });

  it("draws each image of 32 pixels and under from the small drawing, and each larger one from the full drawing", () => {
    for (const { pixels, drawing } of iconImages()) {
      expect([pixels, drawing]).toEqual([pixels, pixels <= 32 ? "assets/icon/app-icon-small.svg" : "assets/icon/app-icon.svg"]);
    }
  });
});

describe("dockImage", () => {
  it("gives an app started from a checkout the PNG beside its script", () => {
    expect(dockImage(false, "/repo/apps/desktop/dist")).toBe("/repo/apps/desktop/dist/app-icon.png");
  });

  it("gives a packaged app no image, so the Dock shows the bundle's icon file at each size", () => {
    expect(dockImage(true, "/Applications/Owlery.app/Contents/Resources/app/dist")).toBeNull();
  });
});
