import { isLocal } from "@worker/trpc/util/local";
import { expect } from "bun:test";
import { test } from "bun:test";
import { describe } from "bun:test";

describe("Check local recognition", () => {
    test("Test local database URL", () => {
        const dbUrl = "postgresql://a:b@localhost:5432/ytweet";
        const result = isLocal(dbUrl);
        expect(result).toBeTrue();
    });

    test("Test local database URL with IP", () => {
        const result = isLocal("postgresql://a:b@127.0.0.1/bla")
        expect(result).toBeTrue();
    })

    test("Test non-local database URL", () => {
        const dbUrl = "postgresql://a:b@remotehost.com:5432/ytweet";
        const result = isLocal(dbUrl);
        expect(result).toBeFalse();
    });

    test("Test non-local database URL with IP", () => {
        const result = isLocal("postgresql://a:b@12.12.12.12/bla");
        expect(result).toBeFalse();
    });
})
