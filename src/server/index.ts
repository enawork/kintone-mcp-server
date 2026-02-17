import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { shouldEnableTool } from "./tool-filters.js";
import { getKintoneClient } from "../client/index.js";
import { createToolCallback, tools } from "../tools/index.js";
import type { KintoneMcpServerOptions } from "./types/server.js";

export type { KintoneMcpServerOptions } from "./types/server.js";

const guestSpaceIdSchema = z
  .string()
  .optional()
  .describe(
    "The ID of the guest space. Required when accessing apps in a guest space.",
  );

export const createServer = (options: KintoneMcpServerOptions): McpServer => {
  const server = new McpServer({
    name: options.name,
    version: options.version,
  });

  const clientConfig = options.config.clientConfig;
  const client = getKintoneClient(clientConfig);
  const toolCondition = options.config.toolConditionConfig;
  const attachmentsDir = options.config.fileConfig.attachmentsDir;
  tools
    .filter((tool) => shouldEnableTool(tool.name, toolCondition))
    .forEach((tool) =>
      server.registerTool(
        tool.name,
        {
          ...tool.config,
          inputSchema: {
            ...tool.config.inputSchema,
            guestSpaceId: guestSpaceIdSchema,
          },
        },
        createToolCallback(tool.callback, {
          client,
          clientConfig,
          attachmentsDir,
        }),
      ),
    );

  return server;
};
