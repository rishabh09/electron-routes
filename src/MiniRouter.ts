import pathToRegexp, {Key} from 'path-to-regexp';
import { Methods, PathHandler, MethodName } from './types';

class MiniRouter {
  public _methods: Methods;

  public constructor() {
    this._methods = {
      get: [],
      post: [],
      put: [],
      delete: [],
      use: [],
    };
  }

  public all(pathMatch: string, callback: PathHandler): void {
    this.get(pathMatch, callback);
    this.post(pathMatch, callback);
    this.put(pathMatch, callback);
    this.delete(pathMatch, callback);
  }

  public request(method: MethodName, pathMatch: string, callback: PathHandler): void {
    pathMatch = pathMatch.replace(/^\//g, '');
    const keys: Key[] = [];
    this._methods[method].push({
      pathComponent: pathMatch,
      pathRegexp: pathToRegexp(pathMatch, keys),
      pathKeys: keys,
      callback,
    });
  }

  public get(pathMatch: string, callback: PathHandler): void {
    this.request('get', pathMatch, callback);
  }

  public post(pathMatch: string, callback: PathHandler): void {
    this.request('post', pathMatch, callback);
  }

  public put(pathMatch: string, callback: PathHandler): void {
    this.request('put', pathMatch, callback);
  }

  public delete(pathMatch: string, callback: PathHandler): void {
    this.request('delete', pathMatch, callback);
  }
  
  use(pathMatch: string, mRouter) {
    const keys: Key[] = [];
    pathMatch = pathMatch.replace(/^\//g, '');
    const use = {
      pathComponent: pathMatch,
      pathRegexp: pathToRegexp(pathMatch, keys, { end: false }),
      pathKeys: keys,
    };
    if (mRouter.constructor === MiniRouter) {
      use.router = mRouter;
    } else if (typeof mRouter === 'function') {
      use.callback = mRouter;
    } else {
      throw new Error('You can only use a router or a function');
    }
    this._methods.use.push(use);
  }

  processRequest(path: string, method, handlers) {
    path = path.replace(/^\//g, '');
    const testHandler = (tHandler) => {
      const tPathMatches = tHandler.pathRegexp.exec(path);
      if (tPathMatches) {
        const params = {};
        tHandler.pathKeys.forEach((pathKey, index) => {
          params[pathKey.name] = tPathMatches[index + 1];
        });
        handlers.push({
          params,
          fn: tHandler.callback,
        });
      }
    };
    this._methods.use.filter(u => !!u.callback).forEach(testHandler);
    this._methods[method.toLowerCase()].forEach(testHandler);
    this._methods.use.filter(u => !!u.router).forEach((tHandler) => {
      const tUseMatches = tHandler.pathRegexp.exec(path);
      if (tUseMatches) {
        const useHandlers = [];
        const params = {};
        tHandler.pathKeys.forEach((pathKey, index) => {
          params[pathKey.name] = tUseMatches[index + 1];
        });
        tHandler.router.processRequest(path.replace(tUseMatches[0], ''), method, useHandlers);
        useHandlers.forEach((tUseHandler) => {
          tUseHandler.params = Object.assign({}, params, tUseHandler.params);
          handlers.push(tUseHandler);
        });
      }
    });
  }
}

export default MiniRouter;
