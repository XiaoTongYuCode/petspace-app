declare module "ali-oss" {
  type OssClientOptions = {
    region?: string;
    endpoint?: string;
    bucket?: string;
    accessKeyId: string;
    accessKeySecret: string;
    stsToken?: string;
    secure?: boolean;
  };

  class Client {
    constructor(options: OssClientOptions);
    head(name: string): Promise<unknown>;
    put(
      name: string,
      file: File | Blob | Buffer,
      options?: {
        mime?: string;
        headers?: Record<string, string>;
      },
    ): Promise<unknown>;
  }

  export default Client;
}

declare module "ali-oss/dist/aliyun-oss-sdk.min.js" {
  export { default } from "ali-oss";
}
