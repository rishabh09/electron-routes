import { app, protocol, remote } from 'electron';

import { routeron } from './index';
import { SuperRouter } from './SuperRouter';

interface Global extends NodeJS.Global {
  __router_schemes__ : string[]
  'super-router': SuperRouter
}

declare var global: Global;

export function initRouter(schemeName: string = 'app'): SuperRouter {
  global['__router_schemes__'] = [schemeName];
  let mainRouter: SuperRouter;
  if (remote) {
    mainRouter = remote.getGlobal('super-router');
  } else {
    if (!app.isReady()) {
      // @ts-ignore
      if (protocol.registerStandardSchemes) {
        // Electron <=4
        // @ts-ignore
        protocol.registerStandardSchemes([schemeName], { secure: true });
      } else {
        // Electron >=5
        // @ts-ignore
        protocol.registerSchemesAsPrivileged([
          {
            scheme: schemeName,
            privileges: {
              secure: true,
              standard: true,
              supportFetchAPI: true,
            },
          },
        ]);
      }
    }

    mainRouter = new SuperRouter(schemeName);
    global['super-router'] = mainRouter;
    routeron();
  }

  return mainRouter;
}
