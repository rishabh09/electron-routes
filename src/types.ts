import { UploadData } from 'electron';
import { Key as RegexKey } from 'path-to-regexp';

import { ElectronResponse } from './Response';
import { Router } from './Router';
import { ParsedQuery } from 'query-string';

export type PathHandler = (
  request: ElectronRequest,
  response: ElectronResponse,
  next: () => void
) => void | Promise<void>;

export interface RequestHandler {
  params: any;
  fn: PathHandler;
}

export interface ElectronRequest {
  params: any;
  method: string;
  referrer: string;
  body: any;
  uploadData: EnhancedUploadData[];
  url: string;
  headers: {};
  query: ParsedQuery;
}

export type MethodName = Exclude<keyof Methods, 'use'>;

export interface EnhancedUploadData extends UploadData {
  stringContent: (() => string) | null;
  json: (() => AnyJson) | null;
}

export interface RouteHandler {
  pathComponent: string;
  pathRegexp: RegExp;
  pathKeys: RegexKey[];
  callback?: PathHandler;
  router?: Router;
}

export interface Methods {
  get: RouteHandler[];
  post: RouteHandler[];
  put: RouteHandler[];
  delete: RouteHandler[];
  use: RouteHandler[];
}

export type AnyJson =  boolean | number | string | null | JsonArray | JsonMap;
interface JsonMap {  [key: string]: AnyJson; }
interface JsonArray extends Array<AnyJson> {}
