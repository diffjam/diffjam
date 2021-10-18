import {countPolicy} from "../src/countPolicy";
import expect from "expect";
import { Policy } from "../src/Policy";

const fakePolicy= (obj: any) => {
  return new Policy("description", obj.command, 0, true);
}

const getException = async (promise: Promise<unknown>) => {
  try {
    await promise;
    throw new Error(`expected exception was not raised`);
  } catch (ex: any) {
    if (ex.message === "expected exception was not raised") {
      console.log("throwing");
      throw ex;
    }
    console.log(`returning: *${ex.message}*`)
    return ex;
  }
};


describe("#countPolicy", () => {

  it("counts lines and records examples", async () => {
    const {count, examples} = await countPolicy(fakePolicy({
      command: `for i in $(seq 0 9); do echo "line $i"; done`,
    }));
    expect(count).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(examples[i]).toBe(`line ${i}`);
    }
  });

  it("can handle when there are no lines at all", async () => {
    // randomized output here so the command doesn't find this test file.
    const command = `git grep ${new Date().getTime()}`;
    const {count, examples} = await countPolicy(fakePolicy({command}));
    expect(examples).toHaveLength(0);
    expect(count).toBe(0);
  });

  it("errors when something goes wrong", async () => {
    const command = `asdf asdf`; // nonsensical command
    const ex = await getException(countPolicy(fakePolicy({
      command,
    })));
    console.log("ex: ", ex);
  });
})