// The package command and the check of a packaged `.dmg`. The decisions are
// functions the cases read: the way of signing the variables give, the
// configuration the packager is handed, and the images of the icon file.
// `packageApp` and `verifyPackage` run them against the machine, and
// `scripts/package.mjs` and `scripts/verify-package.mjs` run those two. The
// module imports nothing of Electron or of the packager: the command hands
// the packager's `build` in.
import { type SpawnSyncReturns, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Configuration } from "electron-builder";

/** The app's bundle identifier, the owner's default of the work item's question Q1 until the owner names another. */
export const BUNDLE_ID = "app.owlery.desktop";

/** The name of the `.dmg`, which carries no version, so one link can serve the newest release's. */
export const ARTIFACT = "Owlery-arm64.dmg";

/** The variables the installed packager reads the certificate and the notarization key from. */
export const SIGNING_VARIABLES = ["CSC_LINK", "CSC_KEY_PASSWORD", "APPLE_API_KEY", "APPLE_API_KEY_ID", "APPLE_API_ISSUER"] as const;

/** How the app is signed: ad hoc, or with the Developer ID certificate and notarized. */
export type SigningWay = "ad-hoc" | "developer-id";

/** What the command says of the way it signed. */
export const WAY_SENTENCE: Record<SigningWay, string> = {
  "ad-hoc": "Signed ad hoc: no signing variable is set, so macOS asks the person to allow the first open.",
  "developer-id": "Signed with the Developer ID certificate and notarized.",
};

/**
 * The way of signing the variables give. A variable that is set and empty
 * counts as not set, as GitHub gives a secret that is not set. Where only
 * some hold text it throws and names each missing one, so no build goes out
 * signed and not notarized.
 */
export function signingWay(env: Readonly<Record<string, string | undefined>>): SigningWay {
  const missing = SIGNING_VARIABLES.filter((name) => !env[name]);
  if (missing.length === SIGNING_VARIABLES.length) return "ad-hoc";
  if (missing.length === 0) return "developer-id";
  throw new Error(`Only some of the signing variables are set. Missing: ${missing.join(", ")}. Set all five to sign with the Developer ID certificate and notarize, or none to sign ad hoc.`);
}

/**
 * Throws where a release's tag is not the app's version. The tag is `v` and
 * the version, and may carry a suffix from `-`, so a build can be made at a
 * tag such as `v0.1.0-rc.1` before the release's own tag.
 */
export function checkTag(tag: string, version: string): void {
  const named = /^v([^-]+)(?:-.*)?$/.exec(tag)?.[1];
  if (named !== version) throw new Error(`The tag ${tag} is not the app's version ${version}. A release's tag is v${version}, with a suffix from "-" where the build is made before the release's own tag.`);
}

/** The part of the configuration for macOS, which the cases read whole. */
type MacConfig = NonNullable<Configuration["mac"]>;

/**
 * The configuration the packager is handed. The app's files stay a folder
 * and not an archive: the user's `claude` loads the role bundle from
 * `dist/bundle`, and the daemon reads its own script to name its build. The
 * install has rebuilt `node-pty` for Electron, so the packager rebuilds
 * nothing. The ad hoc way names the identity `-`, so a certificate of the
 * keychain is never used; the Developer ID way names none, and the packager
 * takes the certificate of `CSC_LINK`. The package's `package.json` gains
 * the product name: Electron names the app by it, and so its user data
 * folder, which an app started from a checkout keeps under the package's
 * `name`. The configuration's own `productName` names the bundle alone.
 */
export function packagerConfig(way: SigningWay, icns: string): Configuration & { mac: MacConfig } {
  const signing = way === "ad-hoc" ? { identity: "-", notarize: false } : { notarize: true };
  return {
    appId: BUNDLE_ID,
    productName: "Owlery",
    extraMetadata: { productName: "Owlery" },
    asar: false,
    npmRebuild: false,
    directories: { output: "out" },
    files: ["dist/**", "package.json"],
    mac: {
      category: "public.app-category.developer-tools",
      icon: icns,
      target: [{ target: "dmg", arch: ["arm64"] }],
      hardenedRuntime: true,
      ...signing,
    },
    dmg: { artifactName: ARTIFACT },
  };
}

/** One image of the icon set: its name in the `.iconset` folder, its pixels, and the drawing it is made from, under the app's folder. */
export interface IconImage {
  name: string;
  pixels: number;
  drawing: string;
}

/**
 * The images `iconutil` reads to make the icon file. Each of 32 pixels and
 * under is drawn from the small drawing, which keeps the owl legible there,
 * and each larger one from the full drawing.
 */
export function iconImages(): IconImage[] {
  const images: [string, number][] = [
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
  ];
  return images.map(([name, pixels]) => ({ name, pixels, drawing: pixels <= 32 ? "assets/icon/app-icon-small.svg" : "assets/icon/app-icon.svg" }));
}

/** How a command ended, with what it wrote to its error stream. */
function outcome(result: SpawnSyncReturns<string>): string {
  const end = result.error ? `could not run (${result.error.message})` : result.status === null ? `ended at ${result.signal}` : `exited ${result.status}`;
  const said = `${result.stderr ?? ""}`.trim();
  return said === "" ? end : `${end}: ${said}`;
}

/** Runs a command and answers with its result, its output read as text. */
function run(command: string, args: readonly string[], options: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}): SpawnSyncReturns<string> {
  return spawnSync(command, args, { encoding: "utf8", ...options });
}

/** Draws the icon file from the two drawings into `work`, and answers with its path. It throws, naming the size, where an image cannot be drawn. */
function drawIcon(appDir: string, work: string): string {
  const set = join(work, "Owlery.iconset");
  mkdirSync(set);
  for (const { name, pixels, drawing } of iconImages()) {
    const image = join(set, name);
    const drawn = run("sips", ["-s", "format", "png", "-z", String(pixels), String(pixels), join(appDir, drawing), "--out", image]);
    if (drawn.status !== 0 || !existsSync(image)) throw new Error(`The icon's ${pixels}-pixel image ${name} could not be drawn from ${drawing}: sips ${outcome(drawn)}`);
  }
  const icns = join(work, "Owlery.icns");
  const made = run("iconutil", ["-c", "icns", set, "-o", icns]);
  if (made.status !== 0) throw new Error(`The icon file could not be made from the ten images: iconutil ${outcome(made)}`);
  return icns;
}

/** The packager's `build`, as the command hands it in. */
export type Build = (options: { projectDir: string; config: Configuration; mac: string[]; publish: "never" }) => Promise<string[]>;

/**
 * Packages the app in `appDir`: checks the release's tag where one is
 * given and decides the way of signing, both before anything is built, then
 * builds `dist/`, draws the icon file, and runs the packager. It answers with
 * the way and the path of the `.dmg` under `out/`.
 */
export async function packageApp(appDir: string, env: Readonly<Record<string, string | undefined>>, build: Build, log: (line: string) => void, tag?: string): Promise<{ way: SigningWay; dmg: string }> {
  if (tag !== undefined) checkTag(tag, (JSON.parse(readFileSync(join(appDir, "package.json"), "utf8")) as { version: string }).version);
  const way = signingWay(env);
  const built = run(process.execPath, ["build.mjs"], { cwd: appDir });
  if (built.status !== 0) throw new Error(`The build of dist/ failed: node build.mjs ${outcome(built)}`);
  const dmg = join(appDir, "out", ARTIFACT);
  // A `.dmg` of an earlier run would stand after a packager that wrote none.
  rmSync(dmg, { force: true });
  const work = mkdtempSync(join(tmpdir(), "owlery-icon-"));
  try {
    await build({ projectDir: appDir, config: packagerConfig(way, drawIcon(appDir, work)), mac: [], publish: "never" });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  if (!existsSync(dmg)) throw new Error(`The packager ended without writing ${dmg}.`);
  log(WAY_SENTENCE[way]);
  log(`The package: ${dmg}`);
  return { way, dmg };
}

/** Throws the check's name with what was found, where `holds` is false. */
function check(holds: boolean, name: string, found: string): void {
  if (!holds) throw new Error(`${name}: ${found}`);
}

/** True while a process with this id exists. */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits until `ready` answers something other than `undefined`, `ms` at most, and answers with it, or with `undefined`. */
async function until<T>(ms: number, ready: () => Promise<T | undefined> | T | undefined): Promise<T | undefined> {
  const deadline = Date.now() + ms;
  for (;;) {
    const value = await ready();
    if (value !== undefined || Date.now() >= deadline) return value;
    await sleep(200);
  }
}

/** A port the system gave as free at this moment. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => (address && typeof address === "object" ? resolve(address.port) : reject(new Error("the system gave no port"))));
    });
  });
}

/** The text of the page's status line, read through the window's debugging port, or `undefined` while the port lists no page. */
async function statusLine(port: number): Promise<string | undefined> {
  let pages: { type: string; webSocketDebuggerUrl: string }[];
  try {
    pages = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()) as typeof pages;
  } catch {
    return undefined;
  }
  const page = pages.find((target) => target.type === "page");
  if (!page) return undefined;
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  try {
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("the debugging port refused the session")), { once: true });
    });
    const answer = new Promise<string>((resolve) => {
      socket.addEventListener("message", (event) => resolve(JSON.parse(String(event.data))?.result?.result?.value ?? ""), { once: true });
    });
    socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: `document.getElementById("status")?.textContent ?? ""`, returnByValue: true } }));
    return await answer;
  } finally {
    socket.close();
  }
}

/** The page's status line when the app has started on an empty user data folder with no other daemon, and no notice stands before it. */
const READY = "Daemon running, no agent";

/**
 * Checks a packaged `.dmg`: mounts it, copies the app out of it, and checks
 * the app's signature, its `Info.plist`, the role bundle's folder, the
 * package's `node-pty`, and a start in the background with a user data
 * folder of its own. Each check that holds is logged; the first that does
 * not throws with its name. The app and its daemon are stopped by the
 * process ids recorded at the start, and the image is unmounted.
 */
export async function verifyPackage(dmg: string, log: (line: string) => void): Promise<void> {
  check(existsSync(dmg), "the image", `${dmg} does not stand`);
  const work = mkdtempSync(join(tmpdir(), "owlery-verify-"));
  const mount = join(work, "image");
  const app = join(work, "Owlery.app");
  let mounted = false;
  let passed = false;
  const started: number[] = [];
  try {
    const attached = run("hdiutil", ["attach", "-nobrowse", "-noautoopen", "-readonly", "-mountpoint", mount, dmg]);
    check(attached.status === 0, "the image mounts", `hdiutil attach ${outcome(attached)}`);
    mounted = true;
    const copied = run("ditto", [join(mount, "Owlery.app"), app]);
    check(copied.status === 0, "the app copies out of the image", `ditto ${outcome(copied)}`);
    const detached = run("hdiutil", ["detach", mount]);
    check(detached.status === 0, "the image unmounts", `hdiutil detach ${outcome(detached)}`);
    mounted = false;
    log(`ok   the image mounted, Owlery.app was copied out of it, and the image was unmounted`);

    const verified = run("codesign", ["--verify", "--deep", "--strict", app]);
    check(verified.status === 0, "the signature", `codesign --verify --deep --strict ${outcome(verified)}`);
    log("ok   the signature: codesign --verify --deep --strict exits 0");

    const contents = join(app, "Contents");
    const plist = run("plutil", ["-convert", "json", "-o", "-", join(contents, "Info.plist")]);
    check(plist.status === 0, "Info.plist", `plutil ${outcome(plist)}`);
    const info = JSON.parse(plist.stdout) as Record<string, unknown>;
    check(info.CFBundleName === "Owlery", "Info.plist's CFBundleName", `${String(info.CFBundleName)}, not Owlery`);
    check(info.CFBundleIdentifier === BUNDLE_ID, "Info.plist's CFBundleIdentifier", `${String(info.CFBundleIdentifier)}, not ${BUNDLE_ID}`);
    const iconFile = String(info.CFBundleIconFile);
    check(existsSync(join(contents, "Resources", iconFile)), "Info.plist's CFBundleIconFile", `${iconFile} does not stand in Contents/Resources`);
    log(`ok   Info.plist names Owlery, ${BUNDLE_ID} and the icon file ${iconFile}, which stands in the bundle`);

    const appFiles = join(contents, "Resources", "app");
    const bundle = join(appFiles, "dist", "bundle");
    check(existsSync(bundle) && statSync(bundle).isDirectory(), "the role bundle", "Contents/Resources/app/dist/bundle is not a folder");
    log("ok   the role bundle stands as the folder Contents/Resources/app/dist/bundle");

    const manifest = JSON.parse(readFileSync(join(appFiles, "package.json"), "utf8")) as { productName?: unknown };
    check(manifest.productName === "Owlery", "the app's name", `Contents/Resources/app/package.json names the product ${JSON.stringify(manifest.productName)}, not "Owlery", so the app would keep its user data with an app started from a checkout`);
    log(`ok   the app's package.json names the product Owlery, so its user data stands under "Owlery"`);

    const binary = join(contents, "MacOS", "Owlery");
    const line = "owlery-pane-check";
    const pane = `const pty = require(process.env.OWLERY_PTY); const p = pty.spawn("/bin/echo", ["${line}"], {}); let out = ""; p.onData((d) => { out += d; }); p.onExit((e) => { process.stdout.write(out); process.exit(e.exitCode); }); setTimeout(() => process.exit(3), 10000);`;
    const ran = run(binary, ["-e", pane], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", OWLERY_PTY: join(appFiles, "node_modules", "node-pty") }, timeout: 20_000 });
    check(ran.status === 0 && ran.stdout.includes(line), "the package's node-pty", `the app's binary as Node ${outcome(ran)}, and printed ${JSON.stringify(ran.stdout.trim())}`);
    log("ok   the package's node-pty, loaded by the app's binary as Node, ran a process that printed its line");

    const userData = join(work, "ud");
    const runDir = join(userData, "run");
    mkdirSync(userData);
    const port = await freePort();
    const appLog = openSync(join(work, "app.log"), "a");
    const env: NodeJS.ProcessEnv = { ...process.env, OWLERY_BACKGROUND: "1", SHELL: "/usr/bin/true", CLAUDE_CONFIG_DIR: join(userData, "claude") };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(binary, [`--remote-debugging-port=${port}`, `--user-data-dir=${userData}`], { env, stdio: ["ignore", appLog, appLog] });
    check(child.pid !== undefined, "the app starts", "the system gave the app no process id");
    const appPid = child.pid as number;
    started.push(appPid);
    const discovery = await until(30_000, () => {
      try {
        return JSON.parse(readFileSync(join(runDir, "daemon.json"), "utf8")) as { pid: number; build?: string };
      } catch {
        return undefined;
      }
    });
    check(discovery !== undefined, "the daemon starts", `no daemon.json in the run folder after 30 s (the app's log: ${join(work, "app.log")})`);
    const { pid: daemonPid, build } = discovery as { pid: number; build?: string };
    started.push(daemonPid);
    let shown = "";
    const ready = await until(30_000, async () => {
      shown = (await statusLine(port)) ?? shown;
      return shown === READY ? true : undefined;
    });
    check(ready === true, "the status line", `it reads ${JSON.stringify(shown)} after 30 s, not ${JSON.stringify(READY)}`);
    log(`ok   the app started in the background, and its status line reads "${READY}", with no notice of another build`);

    const script = createHash("sha256").update(readFileSync(join(appFiles, "dist", "daemon.js"))).digest("hex");
    check(build === script, "daemon.json's build", `${String(build)}, not the SHA-256 of the package's dist/daemon.js, ${script}`);
    log("ok   daemon.json's build is the SHA-256 of the package's dist/daemon.js");

    for (const pid of started) process.kill(pid, "SIGTERM");
    await until(10_000, () => (started.some(alive) ? undefined : true));
    const left = started.filter(alive);
    check(left.length === 0, "the stop", `process ${left.join(" and ")} still runs 10 s after SIGTERM`);
    log(`ok   the app (process ${appPid}) and the daemon (process ${daemonPid}) are gone after the stop`);
    started.length = 0;

    const signer = run("codesign", ["-dv", "--verbose=2", app]);
    if (/^Authority=Developer ID Application:/m.test(signer.stderr)) {
      const assessed = run("spctl", ["--assess", "--type", "execute", app]);
      check(assessed.status === 0, "Gatekeeper's assessment", `spctl --assess --type execute ${outcome(assessed)}`);
      const stapled = run("xcrun", ["stapler", "validate", app]);
      check(stapled.status === 0, "the notarization ticket", `xcrun stapler validate ${outcome(stapled)}`);
      log("ok   signed with a Developer ID certificate: spctl --assess --type execute and xcrun stapler validate each exit 0");
    } else {
      log("--   not signed with a Developer ID certificate, so Gatekeeper's assessment and the notarization ticket are not checked");
    }

    const onDisk = run("du", ["-sk", app]);
    log(`size ${dmg}: ${statSync(dmg).size} bytes; the app copied out of it: ${onDisk.stdout.split("\t")[0]} KiB on disk (du -sk)`);
    passed = true;
  } finally {
    // A check that threw leaves what it started running, and the image mounted.
    for (const pid of started) {
      if (alive(pid)) process.kill(pid, "SIGKILL");
    }
    if (mounted) run("hdiutil", ["detach", "-force", mount]);
    // The copied app and the app's log stay where a check did not hold.
    if (passed) rmSync(work, { recursive: true, force: true });
    else log(`The run's files stay in ${work}`);
  }
}
