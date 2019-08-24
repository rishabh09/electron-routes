import { app, protocol, remote } from "electron";
import { Router } from "./Router";
import { SuperRouter } from "./SuperRouter";

interface Global extends NodeJS.Global {
  Router: Router;
  __router_schemes__: string[];
  "super-router": SuperRouter;
}

declare let global: Global;

function initRouter(schemeName = "app"): SuperRouter {
  let mainRouter: SuperRouter;
  const globalRouter = global["super-router"];
  if (globalRouter) {
    return globalRouter;
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
    return mainRouter;
  }
}

function getRouter(): Router {
  const globalRouter = remote && remote.getGlobal("Router");
  if (!globalRouter) {
    const router = new Router();
    global.Router = router;
    return router;
  } else {
    return new globalRouter();
  }
}

export default function routeron(schemeName?: string): Router {
  if (remote) {
    return getRouter();
  } else {
    return initRouter(schemeName);
  }
}
