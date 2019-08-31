import { remote, webFrame } from "electron";

export default function rendererPreload(): void {
  if (!remote || !webFrame) {
    throw new Error(
      "The renderer preload for electron-router can only be called from a renderer process"
    );
  }

  // Electron <=4
  if (webFrame.registerURLSchemeAsPrivileged) {
    remote
      .getGlobal("__router_schemes__")
      .forEach((schemeName: string) =>
        webFrame.registerURLSchemeAsPrivileged(schemeName)
      );
  }
}
