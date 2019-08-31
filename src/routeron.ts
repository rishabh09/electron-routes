import { app, protocol, remote } from "electron";
import { Router } from "./Router";
import { SuperRouter } from "./SuperRouter";

interface Global extends NodeJS.Global {
  Router: any;
  __router_schemes__: string[];
  "super-router": SuperRouter;
}

declare let global: Global;

export function initRouter(schemeName = "app"): SuperRouter {
  let mainRouter: SuperRouter;
  if (remote) {
    mainRouter = remote.getGlobal("super-router");
  } else {
    if (!app.isReady()) {
      if (protocol.registerStandardSchemes) {
        // Electron <=4
        protocol.registerStandardSchemes([schemeName], { secure: true });
      } else {
        // Electron >=5
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //@ts-ignore
        protocol.registerSchemesAsPrivileged([
          {
            scheme: schemeName,
            privileges: {
              secure: true,
              standard: true,
              supportFetchAPI: true
            }
          }
        ]);
      }
    }
    mainRouter = new SuperRouter(schemeName);
    global["super-router"] = mainRouter;
    routeron();
  }
  return mainRouter;
}

export default function routeron(): Router {
  const globalRouter = remote && remote.getGlobal("Router");
  if (!globalRouter) {
    global.Router = Router;
    const router = new Router();
    return router;
  } else {
    return new globalRouter();
  }
}
