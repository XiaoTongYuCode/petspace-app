import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

const originalEnv = {
  ALIYUN_ACCESS_KEY_ID: process.env.ALIYUN_ACCESS_KEY_ID,
  ALIYUN_ACCESS_KEY_SECRET: process.env.ALIYUN_ACCESS_KEY_SECRET,
  ALIYUN_OSS_BUCKET: process.env.ALIYUN_OSS_BUCKET,
  ALIYUN_OSS_REGION: process.env.ALIYUN_OSS_REGION,
  ALIYUN_OSS_ENDPOINT: process.env.ALIYUN_OSS_ENDPOINT,
  ALIYUN_OSS_PUBLIC_BASE_URL: process.env.ALIYUN_OSS_PUBLIC_BASE_URL,
};

afterEach(() => {
  mock.restoreAll();
  process.env.ALIYUN_ACCESS_KEY_ID = originalEnv.ALIYUN_ACCESS_KEY_ID;
  process.env.ALIYUN_ACCESS_KEY_SECRET = originalEnv.ALIYUN_ACCESS_KEY_SECRET;
  process.env.ALIYUN_OSS_BUCKET = originalEnv.ALIYUN_OSS_BUCKET;
  process.env.ALIYUN_OSS_REGION = originalEnv.ALIYUN_OSS_REGION;
  process.env.ALIYUN_OSS_ENDPOINT = originalEnv.ALIYUN_OSS_ENDPOINT;
  process.env.ALIYUN_OSS_PUBLIC_BASE_URL = originalEnv.ALIYUN_OSS_PUBLIC_BASE_URL;
});

test("uploadImageForUser uploads image through server-side OSS client", async (t) => {
  process.env.ALIYUN_ACCESS_KEY_ID = "test-ak";
  process.env.ALIYUN_ACCESS_KEY_SECRET = "test-sk";
  process.env.ALIYUN_OSS_BUCKET = "example-test-bucket";
  process.env.ALIYUN_OSS_REGION = "oss-cn-beijing";
  process.env.ALIYUN_OSS_ENDPOINT = "oss-cn-beijing.aliyuncs.com";
  process.env.ALIYUN_OSS_PUBLIC_BASE_URL = "https://assets.example.test";

  const putMock = mock.fn(async () => ({ name: "uploaded" }));

  class MockOSSClient {
    put = putMock;
  }

  t.mock.module("ali-oss", {
    defaultExport: MockOSSClient,
  });

  const { uploadImageForUser } = await import("./oss.ts");
  const imageFile = new File([new Uint8Array([1, 2, 3, 4])], "avatar.png", {
    type: "image/png",
  });

  const result = await uploadImageForUser({
    purpose: "cover",
    clerkUserId: "user_123",
    file: imageFile,
  });

  assert.equal(putMock.mock.calls.length, 1);
  const [objectKey, content, options] = putMock.mock.calls[0].arguments;
  assert.match(objectKey as string, /^cover\/user_123\/.+\.png$/);
  assert.equal(Buffer.isBuffer(content), true);
  assert.deepEqual(options, {
    mime: "image/png",
    headers: {
      "Content-Type": "image/png",
    },
  });
  assert.equal(result.objectKey, objectKey);
  assert.equal(result.url, `https://assets.example.test/${objectKey}`);
});

test("uploadImageForUser rejects files above the server upload limit", async () => {
  const { uploadImageBufferForUser } = await import("./oss.ts");

  await assert.rejects(
    uploadImageBufferForUser({
      purpose: "post",
      clerkUserId: "user_123",
      filename: "too-large.jpeg",
      contentType: "image/jpeg",
      fileSize: 4 * 1024 * 1024 + 1,
      content: Buffer.from([1]),
    }),
    /图片不能超过 4MB/,
  );
});
