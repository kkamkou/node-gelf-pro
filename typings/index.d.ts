/**
 You can declare custom alias logging methods by augmenting this module. Example:
 ```
 declare module 'gelf-pro' {
   function waaagh(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): void;
 }
 ```
 */

declare module 'gelf-pro' {
  import { Writable, WritableOptions } from 'stream';

  export type Message = string | number | Date | Error;
  export type BulkMessage = Message | Buffer | { [key: string]: any };
  export type MessageExtra = { [key: string]: any } | Error;
  export type MessageCallback = (error?: Error | null, bytesSent?: number) => void;

  export interface Levels {
    readonly emergency: 0;
    readonly alert: 1;
    readonly critical: 2;
    readonly error: 3;
    readonly warning: 4;
    readonly notice: 5;
    readonly info: 6;
    readonly debug: 7;
  }

  export const levels: Levels;
  export let config: Settings;

  export function setConfig(opts: Partial<Settings>): Logger;

  export function getAdapter(): Adapter;

  export function setAdapter(adapter: Adapter): Logger;

  export function bindAliases(aliasMapping: { [alias: string]: string }, aliasesToRemove?: string[]): Logger;

  export function getStringFromObject(object: { [key: string]: any }): string;

  export function send(message: string | string[], callback?: MessageCallback): Logger;

  export function bulk(messages: BulkMessage | BulkMessage[], callback?: MessageCallback): Logger;

  export function stream(options?: WritableOptions): Writable;

  export function message(message: Message, lvl?: number, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;

  export function emergency(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function alert(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function critical(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function error(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function warning(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function warn(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function notice(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function info(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function debug(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  export function log(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;

  export interface Logger {
    readonly levels: Levels;
    config: Settings;

    setConfig(opts: Partial<Settings>): Logger;

    getAdapter(): Adapter;

    setAdapter(adapter: Adapter): Logger;

    bindAliases(aliasMapping: { [alias: string]: string }, aliasesToRemove?: string[]): Logger;

    getStringFromObject(object: { [key: string]: any }): string;

    send(message: string | string[], callback?: MessageCallback): Logger;

    bulk(messages: BulkMessage | BulkMessage[], callback?: MessageCallback): Logger;

    stream(options?: WritableOptions): Writable;

    message(message: Message, lvl?: number, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;

    emergency(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    alert(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    critical(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    error(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    warning(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    warn(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    notice(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    info(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    debug(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
    log(message: Message, extra?: MessageExtra | MessageCallback, callback?: MessageCallback): Logger;
  }

  export interface Adapter {
    options: { [key: string]: any };

    setOptions(options: { [key: string]: any }): Adapter;

    deflate(message: string, callback: (error: Error | null, result: Buffer) => void): Adapter;

    send(message: string | string[], callback?: MessageCallback): Adapter;
  }

  export interface Settings {
    /**
     * Default fields for all messages.
     */
    fields: { [key: string]: any },
    /**
     * Filter functions, return false in any of them to not send the log message.
     */
    filter: Array<(message: any) => boolean>;
    /**
     * Broadcast methods, to broadcast log message.
     */
    broadcast: Array<(message: any) => any>;
    /**
     * Transformer methods, to transform log message.
     */
    transform: Array<(message: any) => any>;
    /**
     * Log level aliases: {alias: logLevelName}
     */
    aliases?: { [alias: string]: string },
    /**
     * @default udp
     */
    adapterName: 'tcp-tls' | 'tcp' | 'udp',
    adapterOptions: {
      /**
       * @default 127.0.0.1
       */
      host?: string;
      /**
       * @default 12201
       */
      port?: number;
      /**
       * @default 4
       */
      family?: number;
      /**
       * @default 10000
       */
      timeout?: number;
      /**
       * @default udp4
       */
      protocol?: 'udp4' | 'udp6';

      /**
       * tcp-tls only
       * only if using the client certificate authentication
       */
      key?: string | Buffer | Array<string | Buffer>;
      /**
       * tcp-tls only
       * only if using the client certificate authentication
       */
      cert?: string | Buffer | Array<string | Buffer>;
      /**
       * tcp-tls only
       * only if using the client certificate authentication
       */
      ca?: string | Buffer | Array<string | Buffer>;
    }
  }
}
