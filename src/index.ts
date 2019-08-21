import { remote, webFrame } from 'electron';

import MiniRouter from './MiniRouter';
import Router from './Router';

const rendererPreload = () => {
  if (!remote || !webFrame) {
    throw new Error('The renderer preload for electron-router can only be called from a renderer process');
  }
  remote.getGlobal('__router_schemes__').forEach((schemeName: string) => webFrame.registerURLSchemeAsPrivileged(schemeName));
}

export {
  Router,
  MiniRouter,
  rendererPreload
};
