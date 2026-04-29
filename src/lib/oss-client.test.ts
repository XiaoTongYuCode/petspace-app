import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

const originalFetch = globalThis.fetch;

afterEach(() => {
  mock.restoreAll();
  globalThis.fetch = originalFetch;
});

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
