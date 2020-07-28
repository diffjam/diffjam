const countPolicy = require("../countPolicy");
const expect = require("expect");

describe("#countPolicy", () => {

  it("counts lines and records examples", async () => {
    const {count, examples} = await countPolicy({
      command: `for i in $(seq 0 9); do echo "line $i"; done`,
    });
    expect(count).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(examples[i]).toBe(`line ${i}`);
    }
  });
})