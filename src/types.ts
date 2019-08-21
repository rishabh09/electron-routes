import { Key } from "path-to-regexp";
import MiniRouter from "./MiniRouter";

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
  router?: MiniRouter
}


export type MethodName = keyof Methods;

export interface RequestHandler {
  params: any;
  fn: PathHandler;
}