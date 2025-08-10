import { it, expect } from "bun:test"
import { nameInitialsFromName } from "@/utils/name"

it("Test name initials from bill gates", () => {
    expect(nameInitialsFromName("bill gates")).toBe("BG");
})

it("Test name initials from single name", () => {
    expect(nameInitialsFromName("madonna")).toBe("M");
})

it("Empty name should return empty string", () => {
    expect(nameInitialsFromName("")).toBe("");
})
