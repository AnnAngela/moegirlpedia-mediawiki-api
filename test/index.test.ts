import { describe, expect, it, vi } from "vitest";
import { runCli } from "../src/index.js";
import type { OperationDefinition } from "../src/operations/types.js";

const createWritableBuffer = (): { output: string; write(chunk: string): boolean } => {
    let output = "";

    return {
        get output() {
            return output;
        },
        write: (chunk: string) => {
            output += chunk;
            return true;
        },
    };
};

describe("runCli", () => {
    it("renders help when no operation is provided", async () => {
        const stdout = createWritableBuffer();
        const exitCode = await runCli([], { stdout });

        expect(exitCode).toBe(0);
        expect(stdout.output).toContain("Available operations");
    });

    it("executes an injected operation and writes JSON", async () => {
        const stdout = createWritableBuffer();
        const stderr = createWritableBuffer();
        const operation: OperationDefinition = {
            description: "Demo operation.",
            name: "demo",
            run: ({ positionals }) => Promise.resolve({ firstPositional: positionals[0] }),
            usage: "demo <value>",
        };
        const createClient = vi.fn(() => Promise.resolve({ request: vi.fn() }));
        const exitCode = await runCli(["demo", "hello"], {
            createClient,
            operationList: [operation],
            stderr,
            stdout,
        });

        expect(exitCode).toBe(0);
        expect(stderr.output).toBe("");
        expect(stdout.output).toContain("hello");
        expect(createClient).toHaveBeenCalledTimes(1);
    });

    it("returns a non-zero exit code for unknown operations", async () => {
        const stderr = createWritableBuffer();
        const exitCode = await runCli(["missing-operation"], { stderr });

        expect(exitCode).toBe(1);
        expect(stderr.output).toContain("Unknown operation");
    });
});
