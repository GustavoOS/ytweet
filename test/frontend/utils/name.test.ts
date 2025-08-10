import { it, expect } from "bun:test"
import { nameInitialsFromName } from "@/utils/name"

it("Test name initials from full name", () => {
    expect(nameInitialsFromName("John Wesley Doe")).toEqual("JD");
})

it("Test name initials from bill gates", () => {
    expect(nameInitialsFromName("bill gates")).toEqual("BG");
})

it("Test name initials from single name", () => {
    expect(nameInitialsFromName("madonna")).toEqual("M");
})

it("Empty name should return empty string", () => {
    expect(nameInitialsFromName("")).toEqual("");
})
