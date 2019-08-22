import { remote } from 'electron';

import { Router } from './Router';

export default function routeron(): Router {
  const globalRouter = remote && remote.getGlobal('Router');
  if (!globalRouter) {
    // @ts-ignore
    global.Router = Router;
    // @ts-ignore
    return new Router();
  } else {
    return new globalRouter();
  }
}
