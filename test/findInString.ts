import { findInString } from "../src/findInString"
import expect from "expect";

describe("#findInString", () => {
    it ("finds a simple regex", () => {
        expect(findInString("path", [/needle/], "asdf needle asdf")).toEqual([
            {
                number: 1,
                line: "asdf needle asdf",
                match: "needle",
                path: "path",
            }
        ])
    })
    it ("finds a simple substring", () => {
        expect(findInString("path", [/needle/, /qwer/], "asdf needle asdf\nasdf needle qwer")).toEqual([
            {
                number: 2,
                line: "asdf needle qwer",
                match: "needle",
                path: "path",
            }
        ])
    })
})