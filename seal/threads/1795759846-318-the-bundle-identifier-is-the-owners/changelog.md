# Changelog: the bundle identifier is the owner's

Issue #318. The macOS bundle identifier was `app.owlery.desktop`, kept as the default of #78's question Q1 until the owner named another.

- **The app's bundle identifier is `com.akmaios.owlery`.** On 2026-11-27 the owner named it, under the name the owner's products share. macOS ties a person's granted permissions, the Keychain's access lists and the update to this value, so the first public download carries it and no later build changes it.
- **For a contributor:** `apps/desktop/src/package/package.ts#BUNDLE_ID` holds the value; the packager's configuration and the check of the built bundle's `Info.plist` read it from there, and `apps/desktop/test/package.test.ts` pins it.
