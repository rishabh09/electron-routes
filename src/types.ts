import { Key } from "path-to-regexp";

export type PathHandler = (
  request: any,
  response: any,
  next: () => void
) => void | Promise<void>;

export interface Methods {
  get: RouteHandler[];
  post: RouteHandler[];
  put: RouteHandler[];
  delete: RouteHandler[];
  use: RouteHandler[];
}

export interface RouteHandler {
  pathComponent: string;
  pathRegexp: RegExp;
  pathKeys: Key[];
  callback?: PathHandler;
}

export type MethodName = Exclude<keyof Methods, 'use'>;
