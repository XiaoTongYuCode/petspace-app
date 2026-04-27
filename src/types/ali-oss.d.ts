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

  type StsOptions = {
    accessKeyId: string;
    accessKeySecret: string;
    endpoint?: string;
  };

  type StsCredentials = {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
    Expiration: string;
  };

  class Client {
    constructor(options: OssClientOptions);
    head(name: string): Promise<unknown>;
    put(name: string, file: File | Blob): Promise<unknown>;
    multipartUpload(
      name: string,
      file: File | Blob,
      options?: {
        progress?: (percentage: number, checkpoint?: unknown, res?: unknown) => void;
      },
    ): Promise<unknown>;
    static STS: {
      new (options: StsOptions): {
        assumeRole(
          role: string,
          policy: object,
          expiration: number,
          session: string,
        ): Promise<{ credentials: StsCredentials }>;
      };
    };
  }

  export default Client;
}

declare module "ali-oss/dist/aliyun-oss-sdk.min.js" {
  export { default } from "ali-oss";
}
