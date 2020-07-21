const countPolicy = require("../countPolicy");
const expect = require("expect");

describe("#countPolicy", () => {
  it("handles policy that returns number", async () => {
    const {count} = await countPolicy({
      command: "echo 10",
    });
    expect(count).toBe(10);
  });

  it("handles policy that returns lines rather than number", async () => {
    const {count, examples} = await countPolicy({
      command: `for i in $(seq 0 9); do echo "line $i"; done`,
    });
    expect(count).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(examples[i]).toBe(`line ${i}`);
    }
  });
})