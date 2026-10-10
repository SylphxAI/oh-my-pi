import { describe, expect, it } from "bun:test";
import { classifyMessage, retriable } from "@oh-my-pi/pi-ai/error/flags";

// Exact turn-ending error from a Cursor HTTP 400 response.
const CURSOR_TRANSIENT = {
	api: "cursor-agent" as const,
	provider: "cursor",
	model: "claude-opus-5-5-1m",
	errorStatus: 400,
	errorMessage:
		"Cursor PROVIDER_ERROR: Provider Error: We're having trouble connecting to the model provider. This might be temporary - please try again in a moment.",
};

describe("Cursor temporary provider connection failure", () => {
	it("is retriable despite HTTP 400", () => {
		expect(retriable(classifyMessage({ ...CURSOR_TRANSIENT }))).toBe(true);
	});

	it.each([401, 403])("does not override HTTP %s auth rejection", errorStatus => {
		expect(retriable(classifyMessage({ ...CURSOR_TRANSIENT, errorStatus }))).toBe(false);
	});

	it("does not override another provider's HTTP 400", () => {
		expect(retriable(classifyMessage({ ...CURSOR_TRANSIENT, provider: "openai" }))).toBe(false);
	});

	it.each([
		"Cursor INVALID_ARGUMENT: tool schema rejected",
		"Cursor PROVIDER_ERROR: Provider Error: tool schema rejected",
	])("keeps genuine validation errors terminal: %s", errorMessage => {
		expect(retriable(classifyMessage({ ...CURSOR_TRANSIENT, errorMessage }))).toBe(false);
	});
});
