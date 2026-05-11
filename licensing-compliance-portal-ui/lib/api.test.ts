import { readBackendError } from "@/lib/api";

describe("readBackendError", () => {
  it("returns backend message when present", async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          message: "Public register unavailable.",
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(readBackendError(response)).resolves.toBe("Public register unavailable.");
  });

  it("falls back to a generic message when payload cannot be parsed", async () => {
    const response = new Response("not-json", {
      headers: {
        "Content-Type": "text/plain",
      },
    });

    await expect(readBackendError(response)).resolves.toBe("API request failed");
  });
});
