import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

const MAX_UPLOAD_IMAGE_BYTES = 4 * 1024 * 1024;
const TARGET_UPLOAD_IMAGE_BYTES = Math.floor(MAX_UPLOAD_IMAGE_BYTES * 0.92);
const MAX_UPLOAD_IMAGE_ERROR_TEXT = "图片不能超过 4MB。";

const originalFetch = globalThis.fetch;
const originalDocument = globalThis.document;
const originalImage = globalThis.Image;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

afterEach(() => {
  mock.restoreAll();
  globalThis.fetch = originalFetch;
  globalThis.document = originalDocument;
  globalThis.Image = originalImage;
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

function installImageCompressionMocks(blobSize: number) {
  class MockImage {
    naturalWidth = 3200;
    naturalHeight = 2400;
    width = 3200;
    height = 2400;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_value: string) {
      queueMicrotask(() => {
        this.onload?.();
      });
    }
  }

  globalThis.Image = MockImage as unknown as typeof Image;
  globalThis.document = {
    createElement(tagName: string) {
      assert.equal(tagName, "canvas");

      return {
        width: 0,
        height: 0,
        getContext(type: string) {
          assert.equal(type, "2d");
          return {
            drawImage() {},
            fillRect() {},
            fillStyle: "",
          };
        },
        toBlob(
          callback: BlobCallback,
          mimeType = "image/png",
        ) {
          callback(new Blob([new Uint8Array(blobSize)], { type: mimeType }));
        },
      };
    },
  } as unknown as Document;
  URL.createObjectURL = mock.fn(() => "blob:petspace-test") as typeof URL.createObjectURL;
  URL.revokeObjectURL = mock.fn(() => undefined) as typeof URL.revokeObjectURL;
}

test("uploadImageToOss posts FormData to the server upload API", async () => {
  const imageFile = new File([new Uint8Array([1, 2, 3])], "demo.jpeg", {
    type: "image/jpeg",
  });
  const fetchMock = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    assert.equal(url, "/api/oss/upload");
    assert.equal(init?.method, "POST");
    assert.ok(init?.body instanceof FormData);
    assert.equal(init.body.get("purpose"), "post");
    assert.equal(init.body.get("file"), imageFile);

    return new Response(
      JSON.stringify({
        objectKey: "post/user_123/demo.jpeg",
        url: "https://assets.example.test/post/user_123/demo.jpeg",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  });

  globalThis.fetch = fetchMock as typeof fetch;

  const { uploadImageToOss } = await import("./oss-client.ts");
  const progressValues: number[] = [];
  const result = await uploadImageToOss(imageFile, "post", {
    onProgress(percent) {
      progressValues.push(percent);
    },
  });

  assert.deepEqual(result, {
    objectKey: "post/user_123/demo.jpeg",
    url: "https://assets.example.test/post/user_123/demo.jpeg",
  });
  assert.equal(fetchMock.mock.calls.length, 1);
  assert.deepEqual(progressValues, [10, 100]);
});

test("uploadImageToOss does not retry on 401 responses", async () => {
  const imageFile = new File([new Uint8Array([1, 2, 3])], "demo.jpeg", {
    type: "image/jpeg",
  });
  const fetchMock = mock.fn(async () => {
    return new Response(JSON.stringify({ error: "请先登录后再上传图片。" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  globalThis.fetch = fetchMock as typeof fetch;

  const { uploadImageToOss } = await import("./oss-client.ts");
  const retryCalls: number[] = [];

  await assert.rejects(
    uploadImageToOss(imageFile, "post", {
      onRetry(attempt) {
        retryCalls.push(attempt);
      },
    }),
    /请先登录后再上传图片/,
  );

  assert.equal(fetchMock.mock.calls.length, 1);
  assert.deepEqual(retryCalls, []);
});

test("uploadImageToOss compresses oversized images before upload", async () => {
  installImageCompressionMocks(1024);

  const oversizedFile = new File(
    [new Uint8Array(MAX_UPLOAD_IMAGE_BYTES + 1)],
    "large.jpeg",
    {
      type: "image/jpeg",
    },
  );
  const uploadedFiles: File[] = [];
  const fetchMock = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    assert.equal(url, "/api/oss/upload");
    assert.ok(init?.body instanceof FormData);

    const formFile = init.body.get("file");
    assert.ok(formFile instanceof File);
    uploadedFiles.push(formFile);

    return new Response(
      JSON.stringify({
        objectKey: "post/user_123/large.webp",
        url: "https://assets.example.test/post/user_123/large.webp",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  });

  globalThis.fetch = fetchMock as typeof fetch;

  const { uploadImageToOss } = await import("./oss-client.ts");

  await uploadImageToOss(oversizedFile, "post");

  assert.equal(fetchMock.mock.calls.length, 1);
  assert.equal(uploadedFiles.length, 1);
  assert.notEqual(uploadedFiles[0], oversizedFile);
  assert.ok(uploadedFiles[0].size <= TARGET_UPLOAD_IMAGE_BYTES);
  assert.equal(uploadedFiles[0].type, "image/webp");
  assert.equal(uploadedFiles[0].name, "large.webp");
});

test("uploadImageToOss rejects oversized images when compression still exceeds the limit", async () => {
  installImageCompressionMocks(MAX_UPLOAD_IMAGE_BYTES + 1);

  const oversizedFile = new File(
    [new Uint8Array(MAX_UPLOAD_IMAGE_BYTES + 1)],
    "large.jpeg",
    {
      type: "image/jpeg",
    },
  );

  const { uploadImageToOss } = await import("./oss-client.ts");

  await assert.rejects(
    uploadImageToOss(oversizedFile, "post"),
    new RegExp(MAX_UPLOAD_IMAGE_ERROR_TEXT.replace(".", "\\.")),
  );
});
