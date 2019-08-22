import { remote } from 'electron';

import { Router } from './Router';

interface Global extends NodeJS.Global {
  Router: Router;
}

declare let global: Global;

export default function routeron(): Router {
  const globalRouter = remote && remote.getGlobal('Router');
  if (!globalRouter) {
    const router = new Router()
    global.Router = router;
    return router;
  } else {
    return new globalRouter();
  }
}
