import pathToRegexp, { Key as RegexKey } from 'path-to-regexp';

import { Methods, PathHandler, RequestHandler, RouteHandler, MethodName } from './types';


export class Router {
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
    const keys: RegexKey[] = [];
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

  // Overload types
  public use(pathMatch: string, mRouter: Router | PathHandler): void;

  public use(mRouter: PathHandler | Router): void;

  public use(pathMatch: string | PathHandler | Router, mRouter?: Router | PathHandler): void {
    const keys: RegexKey[] = [];
    if (typeof pathMatch !== 'string') {
      mRouter = pathMatch;
      pathMatch = '';
    }

    pathMatch = pathMatch.replace(/^\//g, '');

    const use: RouteHandler = {
      pathComponent: pathMatch,
      pathRegexp: pathToRegexp(pathMatch, keys, { end: false }),
      pathKeys: keys,
    };

    if (mRouter instanceof Router) {
      use.router = mRouter;
    } else if (typeof mRouter === 'function') {
      use.callback = mRouter;
    } else {
      throw new Error('You can only use a Router or a function');
    }

    this._methods.use.push(use);
  }

  protected processRequest(path: string, method: string): RequestHandler[] {
    // Unknown method
    //@ts-ignore
    if (!this._methods[method.toLowerCase()]) {
      return [];
    }

    const handlers: RequestHandler[] = [];
    path = path.replace(/^\//g, '');

    const testHandler = (tHandler: RouteHandler): void => {
      const tPathMatches = tHandler.pathRegexp.exec(path);

      if (tPathMatches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {};
        tHandler.pathKeys.forEach(({ name }, index: number): void => {
          params[name] = tPathMatches[index + 1];
        });
        handlers.push({
          params,
          fn: tHandler.callback!,
        });
      }
    };

    this._methods.use.filter(u => Boolean(u.callback)).forEach(testHandler);
    //@ts-ignore
    this._methods[method.toLowerCase()].forEach(testHandler);
    this._methods.use
      .filter(u => Boolean(u.router))
      .forEach(tHandler => {
        const tUseMatches = tHandler.pathRegexp.exec(path);

        if (tUseMatches) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const params: any = {};
          tHandler.pathKeys.forEach(({ name }, index) => {
            params[name] = tUseMatches[index + 1];
          });
          const useHandlers = tHandler.router!.processRequest(path.replace(tUseMatches[0], ''), method);

          useHandlers.forEach(tUseHandler => {
            tUseHandler.params = { ...params, ...tUseHandler.params };
            handlers.push(tUseHandler);
          });
        }
      });

    return handlers;
  }
}
