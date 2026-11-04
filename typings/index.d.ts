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

  export function setAdapter(adapter: Adapter): Logger;

  export function bindAliases(aliasMapping: { [alias: string]: string }, aliasesToRemove?: string[]): Logger;

  export function getStringFromObject(object: object): string;

  export function send(message: Message, callback: MessageCallback): void;

  export function message(message: Message, lvl: number, extra?: MessageExtra, callback?: MessageCallback): void;

  export interface Logger {
    setConfig(opts: Partial<Settings>): Logger;

    getAdapter(): Adapter;

    setAdapter(adapter: Adapter): Logger;

    bindAliases(aliasMapping: { [alias: string]: string }, aliasesToRemove?: string[]): Logger;

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
     * Log level aliases: {alias: logLevelName}
     */
    aliases: { [alias: string]: string },
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
