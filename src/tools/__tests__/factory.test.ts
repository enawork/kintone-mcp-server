import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTool, createToolCallback } from "../factory.js";
import { z } from "zod";
import {
  createMockClient,
  mockToolCallbackOptions,
  mockKintoneConfig,
} from "../../__tests__/utils.js";

vi.mock("../../client/index.js", () => ({
  getKintoneClientForGuestSpace: vi.fn(),
}));

describe("createTool", () => {
  it("should create a tool with correct structure", () => {
    const inputSchema = {
      x: z.number(),
      y: z.string(),
    };

    const outputSchema = {
      result: z.boolean(),
    };

    const handler = async () => {
      return {
        structuredContent: { result: true },
        content: [{ type: "text" as const, text: "test" }],
      };
    };

    const tool = createTool(
      "test_tool",
      {
        title: "Test Tool",
        description: "Test tool",
        inputSchema,
        outputSchema,
      },
      handler,
    );

    expect(tool).toHaveProperty("name");
    expect(tool).toHaveProperty("config");
    expect(tool).toHaveProperty("callback");

    expect(tool.name).toBe("test_tool");
    expect(tool.config.description).toBe("Test tool");
    expect(tool.config.inputSchema).toBe(inputSchema);
    expect(tool.config.outputSchema).toBe(outputSchema);
    expect(typeof tool.callback).toBe("function");
  });

  it("should create a tool without optional fields", () => {
    const handler = async () => {
      return {
        structuredContent: {},
        content: [],
      };
    };

    const tool = createTool(
      "minimal_tool",
      {
        title: "Minimal Tool",
        description: "A tool with minimal config",
        inputSchema: {},
        outputSchema: {},
      },
      handler,
    );

    expect(tool.name).toBe("minimal_tool");
    expect(tool.config).toEqual({
      title: "Minimal Tool",
      description: "A tool with minimal config",
      inputSchema: {},
      outputSchema: {},
    });
    expect(typeof tool.callback).toBe("function");
  });

  it("should preserve handler function behavior", async () => {
    const inputSchema = {
      value: z.number(),
    };

    const handler = async ({ value }: { value: number }) => {
      return {
        structuredContent: { doubled: value * 2 },
        content: [
          { type: "text" as const, text: `${value} * 2 = ${value * 2}` },
        ],
      };
    };

    const tool = createTool(
      "double_tool",
      {
        title: "Double Tool",
        description: "Doubles a number",
        inputSchema,
        outputSchema: { doubled: z.number() },
      },
      handler,
    );

    const result = await tool.callback({ value: 5 }, mockToolCallbackOptions());

    expect(result.structuredContent).toEqual({ doubled: 10 });
    expect(result.content).toEqual([{ type: "text", text: "5 * 2 = 10" }]);
  });
});

describe("createToolCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should wrap callback with options", async () => {
    const callback = async (args: any, options: any) => ({
      content: [
        {
          type: "text" as const,
          text: `Value: ${args.value}, Version: ${options.version}`,
        },
      ],
    });

    const options = mockToolCallbackOptions();
    const wrappedCallback = createToolCallback(callback, options);
    const result = await wrappedCallback({ value: "test" });

    expect(result.content).toEqual([
      { type: "text", text: "Value: test, Version: 1.0.0" },
    ]);
  });

  it("should use default client when guestSpaceId is not provided", async () => {
    const defaultClient = createMockClient();
    const receivedOptions: any[] = [];
    const callback = async (args: any, options: any) => {
      receivedOptions.push(options);
      return {
        content: [{ type: "text" as const, text: "ok" }],
      };
    };

    const options = {
      client: defaultClient,
      clientConfig: mockKintoneConfig,
    };
    const wrappedCallback = createToolCallback(callback, options);
    await wrappedCallback({ appId: "1" });

    expect(receivedOptions[0].client).toBe(defaultClient);
  });

  it("should create guest space client when guestSpaceId is provided", async () => {
    const { getKintoneClientForGuestSpace } =
      await import("../../client/index.js");
    const defaultClient = createMockClient();
    const guestClient = createMockClient();
    vi.mocked(getKintoneClientForGuestSpace).mockReturnValue(guestClient);

    const receivedOptions: any[] = [];
    const callback = async (args: any, options: any) => {
      receivedOptions.push(options);
      return {
        content: [{ type: "text" as const, text: "ok" }],
      };
    };

    const options = {
      client: defaultClient,
      clientConfig: mockKintoneConfig,
    };
    const wrappedCallback = createToolCallback(callback, options);
    await wrappedCallback({ appId: "1", guestSpaceId: "5" });

    expect(getKintoneClientForGuestSpace).toHaveBeenCalledWith(
      mockKintoneConfig,
      "5",
    );
    expect(receivedOptions[0].client).toBe(guestClient);
  });

  it("should strip guestSpaceId from args passed to the callback", async () => {
    const { getKintoneClientForGuestSpace } =
      await import("../../client/index.js");
    vi.mocked(getKintoneClientForGuestSpace).mockReturnValue(
      createMockClient(),
    );

    const receivedArgs: any[] = [];
    const callback = async (args: any, _options: any) => {
      receivedArgs.push(args);
      return {
        content: [{ type: "text" as const, text: "ok" }],
      };
    };

    const options = {
      client: createMockClient(),
      clientConfig: mockKintoneConfig,
    };
    const wrappedCallback = createToolCallback(callback, options);
    await wrappedCallback({ appId: "1", guestSpaceId: "5" });

    expect(receivedArgs[0]).toEqual({ appId: "1" });
    expect(receivedArgs[0]).not.toHaveProperty("guestSpaceId");
  });

  it("should use default client when guestSpaceId is empty string", async () => {
    const defaultClient = createMockClient();
    const receivedOptions: any[] = [];
    const callback = async (args: any, options: any) => {
      receivedOptions.push(options);
      return {
        content: [{ type: "text" as const, text: "ok" }],
      };
    };

    const options = {
      client: defaultClient,
      clientConfig: mockKintoneConfig,
    };
    const wrappedCallback = createToolCallback(callback, options);
    await wrappedCallback({ appId: "1", guestSpaceId: "" });

    expect(receivedOptions[0].client).toBe(defaultClient);
  });

  it("should use default client when guestSpaceId is undefined", async () => {
    const defaultClient = createMockClient();
    const receivedOptions: any[] = [];
    const callback = async (args: any, options: any) => {
      receivedOptions.push(options);
      return {
        content: [{ type: "text" as const, text: "ok" }],
      };
    };

    const options = {
      client: defaultClient,
      clientConfig: mockKintoneConfig,
    };
    const wrappedCallback = createToolCallback(callback, options);
    await wrappedCallback({ appId: "1", guestSpaceId: undefined });

    expect(receivedOptions[0].client).toBe(defaultClient);
  });
});
