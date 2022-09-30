import { GagType } from "./domain";
import { garble } from "./garble";

describe("garble", () => {
  it("Should garble not emotes", () => {
    const x = garble("*tests stuff*", GagType.Ball);
    expect(x).toBe("*tests stuff*");
  });
});
