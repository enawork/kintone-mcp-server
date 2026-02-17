import type { z, ZodRawShape, ZodTypeAny } from "zod";
import type {
  ToolConfig,
  KintoneToolCallback,
  Tool,
  ToolCallbackOptions,
} from "./types/tool.js";
import { getKintoneClientForGuestSpace } from "../client/index.js";

export const createTool = <
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
>(
  name: string,
  config: ToolConfig<InputArgs, OutputArgs>,
  callback: KintoneToolCallback<InputArgs>,
): Tool<InputArgs, OutputArgs> => {
  return {
    name,
    config,
    callback,
  };
};

export const createToolCallback = <InputArgs extends ZodRawShape>(
  callback: KintoneToolCallback<InputArgs>,
  options: ToolCallbackOptions,
) => {
  return (args: z.objectOutputType<InputArgs, ZodTypeAny>) => {
    const { guestSpaceId, ...restArgs } = args as Record<string, unknown>;
    const effectiveOptions =
      typeof guestSpaceId === "string" && guestSpaceId.length > 0
        ? {
            ...options,
            client: getKintoneClientForGuestSpace(
              options.clientConfig,
              guestSpaceId,
            ),
          }
        : options;
    return callback(
      restArgs as z.objectOutputType<InputArgs, ZodTypeAny>,
      effectiveOptions,
    );
  };
};
