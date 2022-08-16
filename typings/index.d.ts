/**
 You can declare your available logging methods by augmenting this module. Example with the default levels:
 ```
 declare module 'gelf-pro' {
    function emergency(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function alert(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function critical(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function error(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function warning(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function warn(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function notice(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function info(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function debug(message: Message, extra?: MessageExtra, callback?: MessageCallback);
    function log(message: Message, extra?: MessageExtra, callback?: MessageCallback);
  }
 ```
 */

declare module 'gelf-pro' {

  export type Message = string | Error;
  export type MessageExtra = object | Error;
  export type MessageCallback = (error?: Error, packetLength?: number) => void;

  export function setConfig(opts: Partial<Settings>): Logger;

  export function getAdapter(): Adapter;

  export function getStringFromObject(object: object): string;

  export function send(message: Message, callback: MessageCallback): void;

  export function message(message: Message, lvl: number, extra?: MessageExtra, callback?: MessageCallback): void;

  export interface Logger {
    setConfig(opts: Partial<Settings>): Logger;

    getAdapter(): Adapter;

    getStringFromObject(object: object): string;

    send(message: Message, callback: MessageCallback): void;

    message(message: Message, lvl: number, extra?: any, callback?: MessageCallback): void;
  }

  export interface Adapter {
    setOptions(options: any): Adapter;

    send(message: Message, callback: MessageCallback): void;
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
     * @default {emergency: 0, alert: 1, critical: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7}
     */
    levels: { [levelName: string]: number },
    /**
     * Log level aliases: {alias: logLevelName}
     */
    aliases: { [allias: string]: string }
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
       * @default 1000
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
      key?: string;
      /**
       * tcp-tls only
       * only if using the client certificate authentication
       */
      cert?: string;
      /**
       * tcp-tls only
       * only if using the client certificate authentication
       */
      ca?: string;
    }
  }
}
