declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>;
  export function toDataURL(text: string, callback: (err: Error, url: string) => void): void;
}
