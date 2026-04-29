import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

const originalFetch = globalThis.fetch;

afterEach(() => {
  mock.restoreAll();
  globalThis.fetch = originalFetch;
});

test("uploadImageToOss uploads small images with put instead of multipartUpload", async (t) => {
  const fetchMock = mock.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url === "/api/oss/sts") {
      return new Response(
        JSON.stringify({
          bucket: "example-test-bucket",
          region: "oss-cn-beijing",
          endpoint: "oss-cn-beijing.aliyuncs.com",
          objectKey: "post/user_123/demo.jpeg",
          publicUrl: "https://assets.example.test/post/user_123/demo.jpeg",
          expiresAt: "2099-01-01T00:00:00.000Z",
          credentials: {
            accessKeyId: "sts-ak",
            accessKeySecret: "sts-sk",
            stsToken: "sts-token",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    throw new Error(`unexpected fetch: ${url}`);
  });

  globalThis.fetch = fetchMock as typeof fetch;

  const putMock = mock.fn(async () => ({ name: "post/user_123/demo.jpeg" }));
  const multipartUploadMock = mock.fn(async () => ({ name: "should-not-run" }));

  class MockOSSClient {
    put = putMock;
    multipartUpload = multipartUploadMock;
  }

  t.mock.module("ali-oss/dist/aliyun-oss-sdk.min.js", {
    defaultExport: MockOSSClient,
  });

  const { uploadImageToOss } = await import("./oss-client.ts");
  const imageFile = new File([new Uint8Array([1, 2, 3])], "demo.jpeg", {
    type: "image/jpeg",
  });

  const progressValues: number[] = [];
  const result = await uploadImageToOss(imageFile, "post", {
    onProgress(percent) {
      progressValues.push(percent);
    },
  });

  assert.deepEqual(result, {
    url: "https://assets.example.test/post/user_123/demo.jpeg",
    objectKey: "post/user_123/demo.jpeg",
  });
  assert.equal(fetchMock.mock.calls.length, 1);
  assert.equal(putMock.mock.calls.length, 1);
  assert.equal(multipartUploadMock.mock.calls.length, 0);
  assert.deepEqual(progressValues, [10, 100]);
});
