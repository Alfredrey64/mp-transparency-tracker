import { describe, expect, it } from "vitest";
import { describeSpeaking } from "./mpSpeakingView";

describe("describeSpeaking", () => {
  const file = { median: 40 };
  it("says where a count sits without judging", () => {
    expect(describeSpeaking({ count: 90 }, file).against).toBe("more than the typical MP");
    expect(describeSpeaking({ count: 38 }, file).against).toBe("about the same as the typical MP");
    expect(describeSpeaking({ count: 10 }, file).against).toBe("fewer than the typical MP");
    expect(describeSpeaking(undefined, file)).toBeNull();
  });
});
