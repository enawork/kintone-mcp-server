import type { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape, ZodTypeAny, z } from "zod";
import type { KintoneClientConfig } from "../../client/types/client.js";

export type ToolCallbackOptions = {
  client: KintoneRestAPIClient;
  clientConfig: KintoneClientConfig;
  attachmentsDir?: string;
};

export type ToolConfig<
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
> = {
  title: string;
  description: string;
  inputSchema: InputArgs;
  outputSchema: OutputArgs;
};

export type Tool<
  InputArgs extends ZodRawShape = ZodRawShape,
  OutputArgs extends ZodRawShape = ZodRawShape,
> = {
  name: string;
  config: ToolConfig<InputArgs, OutputArgs>;
  callback: KintoneToolCallback<InputArgs>;
};

export type KintoneToolCallback<InputArgs extends ZodRawShape> = (
  args: z.objectOutputType<InputArgs, ZodTypeAny>,
  extra: ToolCallbackOptions,
) => CallToolResult | Promise<CallToolResult>;
