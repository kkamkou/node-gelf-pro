declare module 'gelf-pro' {

  /**
   * Additional fields list.
   */
  export interface IAdditionalFields {
    // Name: value.
    [name: string]: string | number | IAdditionalFields;
  }
  /**
   * Levels definition object.
   */
  export interface ILevelsList {
    // Name: numeric value.
    [name: string]: number;
  }
  /**
   * Levels definition object.
   */
  export interface IAdapterOptions {
    // Protocol version for UDP adapter ('udp4' or 'udp6').
    protocol?: string;
    // IP stack family version for TCP adapter (4 or 6).
    family?: number;
    // TCP adapter timeout value in msec.
    timeout?: number;
    // Graylog server hostname.
    host?: string;
    // Graylog server port number.
    port?: number;
  }
  /**
   * Gelf-pro configuration object.
   */
  export interface IGelfProConfig {
    // Additional fields to add to all messages.
    fields?: IAdditionalFields;
    // Filters to discard a message.
    filter?: Function[];
    // Transformers for a message.
    transform?: Function[];
    // Listeners of a message.
    broadcast?: EventListener[];
    // Custom levels name.
    levels?: ILevelsList;
    // Gelf-pro adapter's name ('tcp' or 'udp').
    adapterName?: string;
    // Gelf-pro adapter options.
    adapterOptions?: IAdapterOptions;
  }

  /**
   * Set gelf-pro configuration.
   */
  export function setConfig(config: IGelfProConfig): void;

  /**
   * Emit an emergency message.
   */
  export function emergency(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit an alert message.
   */
  export function alert(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit a critical message.
   */
  export function critical(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit an error message.
   */
  export function error(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit a warning message.
   */
  export function warning(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit a warning message.
   */
  export function warn(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit a notification message.
   */
  export function notice(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit an informational message.
   */
  export function info(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit a debug message.
   */
  export function debug(message: any, extra?: IAdditionalFields, callback?: Function): void;
  /**
   * Emit a debug message.
   */
  export function log(message: any, extra?: IAdditionalFields, callback?: Function): void;
}
