import { Headers, StreamProtocolResponse } from 'electron';
import { getType } from 'mime';
import { Readable, ReadableOptions } from 'stream';
import {AnyJson} from './types'

function getStatusMessage(statusCode: number): string {
  switch (statusCode) {
    case 200:
      return 'OK';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 500:
      return 'Internal Server Error';
    default:
      return `${statusCode}`;
  }
}

class StringStream extends Readable {
  private text: string;

  private encoding: BufferEncoding;
  private closed: boolean;

  public constructor(text: string, opts: ReadableOptions) {
    super(opts);
    this.encoding = opts.encoding as BufferEncoding;
    this.text = text;
    this.closed = false;
  }

  public _read(): void {
    if (!this.closed) {
      this.push(Buffer.from(this.text, this.encoding));
      this.push(null);
      this.closed = true;
    }
  }
}

export class ElectronResponse {
  private callback: (response?: StreamProtocolResponse) => void;

  public called: boolean;

  private headers: Headers;

  private statusCode: number;

  public constructor(cb: (response?: StreamProtocolResponse) => void) {
    this.called = false;
    this.callback = cb;
    this.headers = {
      'X-Powered-By': 'Electron',
      'Content-Type': 'text/plain; charset=utf-8',
    };
    this.statusCode = 200;
  }

  public send(text: string, encoding?: string): void;

  public send(data: Readable): void;

  public send(data: Readable | string, encoding?: string): void {
    this.called = true;

    if (typeof data === 'string') {
      data = new StringStream(data, { encoding });
    }

    // @ts-ignore
    this.callback({
      headers: this.headers,
      data,
      statusCode: this.statusCode,
    });
  }

  public type(fileName: string): ElectronResponse {
    const mimeType = getType(fileName);
    if (mimeType) {
      this.set('Content-Type', mimeType);
    }

    return this;
  }

  public json(data: AnyJson): void {
    this.type('json').send(JSON.stringify(data));
  }

  public set(headerKey: string, headerValue: string): ElectronResponse;

  public set(headers: Headers): ElectronResponse;

  public set(headers: Headers | string, headerValue?: string): ElectronResponse {
    if (typeof headers === 'string') {
      headers = {
        [headers]: headerValue,
      };
    }

    Object.assign(this.headers, headers);
    return this;
  }

  public status(statusCode: number): ElectronResponse {
    this.statusCode = statusCode;
    return this;
  }

  public sendStatus(statusCode: number): void {
    this.status(statusCode).send(getStatusMessage(statusCode));
  }
}
