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
    // Protocol version for UDP adapter.
    protocol?: 'udp4' | 'udp6',
    // IP stack family version for TCP adapter.
    family?: 4 | 6,
    // TCP adapter timeout value in msec.
    timeout?: number,
    // Graylog server hostname.
    host?: string,
    // Graylog server port number.
    port?: 12201,
  }
  /**
   * Gelf-pro configuration object.
   */
  export interface IGelfProConfig {
    // Additional fields to add to all messages.
    fields?: IAdditionalFields,
    // Filters to discard a message.
    filter?: Function[],
    // Transformers for a message.
    transform?: Function[],
    // Listeners of a message.
    broadcast?: EventListener[],
    // Custom levels name.
    levels?: ILevelsList,
    // Gelf-pro adapter's name ('tcp' or 'udp').
    adapterName?: 'udp' | 'tcp',
    // Gelf-pro adapter options.
    adapterOptions?: IAdapterOptions,
  }

  /**
   * Set gelf-pro configuration.
   */
  export function setConfig(config: IGelfProConfig);

  /**
   * Emit an emergency message.
   */
  export function emergency(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit an alert message.
   */
  export function alert(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit a critical message.
   */
  export function critical(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit an error message.
   */
  export function error(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit a warning message.
   */
  export function warning(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit a warning message.
   */
  export function warn(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit a notification message.
   */
  export function notice(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit an informational message.
   */
  export function info(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit a debug message.
   */
  export function debug(message: any, extra?: IAdditionalFields, callback?: Function);
  /**
   * Emit a debug message.
   */
  export function log(message: any, extra?: IAdditionalFields, callback?: Function);
}
