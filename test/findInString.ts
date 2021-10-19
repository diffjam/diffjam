import { findInString } from "../src/findInString"
import expect from "expect";

describe("#findInString", () => {
    it ("finds a simple regex", () => {
        expect(findInString(/needle/, "asdf needle asdf")).toEqual([
            {
                number: 1,
                line: "asdf needle asdf",
                match: "needle",
            }
        ])
    })
    it ("finds a simple substring", () => {
        expect(findInString("needle", "asdf needle asdf")).toEqual([
            {
                number: 1,
                line: "asdf needle asdf",
                match: "needle",
            }
        ])
    })
})