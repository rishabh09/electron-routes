import { app, RegisterStreamProtocolRequest, remote, session, StreamProtocolResponse, UploadData } from 'electron';
import queryString from 'query-string';

import { ElectronResponse } from './Response';
import { Router } from './Router';
import { ElectronRequest, EnhancedUploadData, RequestHandler } from './types';

const electronApp = app || remote.app;
const electronSession = session || remote.session;

function enhanceUploadData(uploadData: UploadData[]): EnhancedUploadData[] {
  return uploadData.map((data: UploadData) => {
    const enhancedData: EnhancedUploadData = {...data, stringContent: null, json: null}
    if (data.bytes && data.bytes.toString) {
      enhancedData.stringContent = () => data.bytes.toString();
      enhancedData.json = () => enhancedData.stringContent && JSON.parse(enhancedData.stringContent());
    }
    return enhancedData;
  });
}

export class SuperRouter extends Router {
  private scheme: string;
  public constructor(scheme: string) {
    super();
    this.scheme = scheme;
    if (electronApp.isReady()) {
      this.registerScheme();
    } else {
      electronApp.on('ready', this.registerScheme.bind(this));
    }
  }

  private registerScheme(): void {
    electronSession.defaultSession!.protocol.unregisterProtocol(this.scheme);
    electronSession.defaultSession!.protocol.registerStreamProtocol(
      this.scheme,
      this._handle.bind(this),
      (error: Error) => {
        if (error) throw error;
      }
    );
  }

  public reset(): void {
    this._methods.use.splice(0, this._methods.use.length);
  }

  private _handle(request: RegisterStreamProtocolRequest, cb: (response?: StreamProtocolResponse) => void): void {
    const { url, referrer, method, uploadData, headers } = request;
    const path = decodeURIComponent(new URL(url).pathname);
    const query = queryString.parse(decodeURIComponent(new URL(url).search));

    const handlers: RequestHandler[] = this.processRequest(path, method);

    const res = new ElectronResponse(cb);

    if (handlers.length === 0) {
      res.sendStatus(404);
    } else {
      const uploadData_ = enhanceUploadData(uploadData || []);

      const req: ElectronRequest = {
        params: {},
        method,
        referrer,
        uploadData: uploadData_,
        body: uploadData_.length && uploadData_[0].json ? uploadData_[0].json() : {},
        url: path,
        headers,
        query,
      };

      const attemptHandler = (index: number): void => {
        const tHandler = handlers[index];
        req.params = tHandler.params;

        const next = (): void => {
          if (res.called) {
            throw new Error("Can't call next once data has already been sent as a response");
          }

          if (index + 1 < handlers.length) {
            attemptHandler(index + 1);
          } else {
            res.sendStatus(404);
          }
        };

        tHandler.fn(req, res, next);
      };

      attemptHandler(0);
    }
  }
}
