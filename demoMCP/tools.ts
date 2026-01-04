import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs";

const usersFilePath = "demoMCP/users.json";

const UserSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  email: z.string(),
  address: z.string(),
  phone: z.string(),
  favoriteColor: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

const successSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

type User = z.infer<typeof UserSchema>;

interface SuccessResponse<T> {
  [key: string]: unknown;
  success: true;
  data: T;
}

interface ErrorResponse {
  [key: string]: unknown;
  success: false;
  error: {
    code: string;
    message: string;
  };
}

function successContent<T>(data: T) {
  const response: SuccessResponse<T> = { success: true, data };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(response) }],
    structuredContent: response,
  };
}

function errorContent(code: string, message: string) {
  const response: ErrorResponse = { success: false, error: { code, message } };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(response) }],
    structuredContent: response,
    isError: true,
  };
}

function getUsers(): User[] {
  const userData = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(userData) as User[];
}

async function saveUsers(users: User[]) {
  await fs.promises.writeFile(
    usersFilePath,
    JSON.stringify(users, null, 2),
    "utf-8"
  );
}

async function createUser(params: {
  name: string;
  email: string;
  address: string;
  phone: string;
  favoriteColor?: string;
}): Promise<User> {
  const users = getUsers();
  const nextId = users.reduce((max, u) => Math.max(max, u.id ?? 0), 0) + 1;
  const newUser: User = {
    id: nextId,
    name: params.name,
    email: params.email,
    address: params.address,
    phone: params.phone,
    favoriteColor: params.favoriteColor,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

async function deleteUser(id: number): Promise<User> {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error(`User with id ${id} not found`);
  }
  const deletedUser = users[index];
  users.splice(index, 1);
  await saveUsers(users);
  return deletedUser;
}

async function updateUser(
  id: number,
  params: {
    name?: string;
    email?: string;
    address?: string;
    phone?: string;
    favoriteColor?: string;
  }
): Promise<User> {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error(`User with id ${id} not found`);
  }
  users[index] = { ...users[index], ...params };
  await saveUsers(users);
  return users[index];
}

export function registerTools(mcpServer: McpServer) {
  mcpServer.registerTool(
    "create-user",
    {
      title: "Create User",
      description:
        "Create a new user in the database. Returns the created user object with its assigned ID. Users are active by default.",
      inputSchema: {
        name: z.string(),
        email: z.string(),
        address: z.string(),
        phone: z.string(),
        favoriteColor: z.string().optional(),
      },
      outputSchema: successSchema(
        z.object({ user: UserSchema, action: z.literal("created") })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const user = await createUser(params);
        return successContent({ user, action: "created" as const });
      } catch (error) {
        return errorContent(
          "CREATE_USER_FAILED",
          error instanceof Error ? error.message : "Failed to create user"
        );
      }
    }
  );

  mcpServer.registerTool(
    "delete-user",
    {
      title: "Delete User",
      description:
        "Delete a user from the database by ID. Returns the deleted user object.",
      inputSchema: {
        id: z.number(),
      },
      outputSchema: successSchema(
        z.object({ user: UserSchema, action: z.literal("deleted") })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const user = await deleteUser(params.id);
        return successContent({ user, action: "deleted" as const });
      } catch (error) {
        return errorContent(
          "DELETE_USER_FAILED",
          error instanceof Error ? error.message : "Failed to delete user"
        );
      }
    }
  );

  mcpServer.registerTool(
    "update-user",
    {
      title: "Update User",
      description:
        "Update an existing user in the database by ID. Returns the updated user object.",
      inputSchema: {
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        favoriteColor: z.string().optional(),
      },
      outputSchema: successSchema(
        z.object({ user: UserSchema, action: z.literal("updated") })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const { id, ...updateParams } = params;
        const user = await updateUser(id, updateParams);
        return successContent({ user, action: "updated" as const });
      } catch (error) {
        return errorContent(
          "UPDATE_USER_FAILED",
          error instanceof Error ? error.message : "Failed to update user"
        );
      }
    }
  );

  mcpServer.registerTool(
    "get-users",
    {
      title: "Get Users",
      description:
        "Get all users from the database. Returns an array of user objects with count.",
      outputSchema: successSchema(
        z.object({ users: z.array(UserSchema), count: z.number() })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const users = getUsers();
        return successContent({ users, count: users.length });
      } catch (error) {
        return errorContent(
          "GET_USERS_FAILED",
          error instanceof Error ? error.message : "Failed to get users"
        );
      }
    }
  );

  mcpServer.registerTool(
    "get-user-by-id",
    {
      title: "Get User By ID",
      description:
        "Get a single user by their ID. Returns the user object if found.",
      inputSchema: {
        id: z.number(),
      },
      outputSchema: successSchema(z.object({ user: UserSchema })),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const user = users.find((u) => u.id === params.id);
        if (!user) {
          return errorContent(
            "USER_NOT_FOUND",
            `User with id ${params.id} not found`
          );
        }
        return successContent({ user });
      } catch (error) {
        return errorContent(
          "GET_USER_FAILED",
          error instanceof Error ? error.message : "Failed to get user"
        );
      }
    }
  );

  mcpServer.registerTool(
    "search-users",
    {
      title: "Search Users",
      description:
        "Search users by name, email, address, or phone. Supports partial matching and pagination.",
      inputSchema: {
        query: z.string(),
        field: z
          .enum(["name", "email", "address", "phone", "all"])
          .default("all"),
        limit: z.number().optional(),
        offset: z.number().optional(),
      },
      outputSchema: successSchema(
        z.object({
          users: z.array(UserSchema),
          total: z.number(),
          limit: z.number(),
          offset: z.number(),
          hasMore: z.boolean(),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const query = params.query.toLowerCase();
        const field = params.field ?? "all";
        const limit = params.limit ?? 50;
        const offset = params.offset ?? 0;

        const matches = users.filter((user) => {
          if (field === "all") {
            return (
              user.name.toLowerCase().includes(query) ||
              user.email.toLowerCase().includes(query) ||
              user.address.toLowerCase().includes(query) ||
              user.phone.toLowerCase().includes(query)
            );
          }
          return user[field].toLowerCase().includes(query);
        });

        const paginated = matches.slice(offset, offset + limit);

        return successContent({
          users: paginated,
          total: matches.length,
          limit,
          offset,
          hasMore: offset + limit < matches.length,
        });
      } catch (error) {
        return errorContent(
          "SEARCH_FAILED",
          error instanceof Error ? error.message : "Failed to search users"
        );
      }
    }
  );

  mcpServer.registerTool(
    "check-email-exists",
    {
      title: "Check Email Exists",
      description:
        "Check if an email address is already registered in the database.",
      inputSchema: {
        email: z.string(),
      },
      outputSchema: successSchema(
        z.object({
          exists: z.boolean(),
          userId: z.number().nullable(),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const exists = users.some(
          (u) => u.email.toLowerCase() === params.email.toLowerCase()
        );
        const user = exists
          ? users.find(
              (u) => u.email.toLowerCase() === params.email.toLowerCase()
            )
          : null;
        return successContent({
          exists,
          userId: user?.id ?? null,
        });
      } catch (error) {
        return errorContent(
          "CHECK_EMAIL_FAILED",
          error instanceof Error ? error.message : "Failed to check email"
        );
      }
    }
  );

  mcpServer.registerTool(
    "bulk-delete-users",
    {
      title: "Bulk Delete Users",
      description:
        "Delete multiple users at once by their IDs. Returns the list of deleted users and any failures.",
      inputSchema: {
        ids: z.array(z.number()),
      },
      outputSchema: successSchema(
        z.object({
          deleted: z.array(UserSchema),
          deletedCount: z.number(),
          notFound: z.array(z.number()),
          notFoundCount: z.number(),
        })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const deleted: User[] = [];
        const notFound: number[] = [];

        const remainingUsers = users.filter((user) => {
          if (user.id !== undefined && params.ids.includes(user.id)) {
            deleted.push(user);
            return false;
          }
          return true;
        });

        for (const id of params.ids) {
          if (!deleted.some((u) => u.id === id)) {
            notFound.push(id);
          }
        }

        await saveUsers(remainingUsers);

        return successContent({
          deleted,
          deletedCount: deleted.length,
          notFound,
          notFoundCount: notFound.length,
        });
      } catch (error) {
        return errorContent(
          "BULK_DELETE_FAILED",
          error instanceof Error ? error.message : "Failed to delete users"
        );
      }
    }
  );

  mcpServer.registerTool(
    "get-user-stats",
    {
      title: "Get User Stats",
      description:
        "Get statistics about users in the database including active/inactive counts and popular colors.",
      outputSchema: successSchema(
        z.object({
          totalUsers: z.number(),
          activeUsers: z.number(),
          inactiveUsers: z.number(),
          usersWithFavoriteColor: z.number(),
          topEmailDomains: z.array(
            z.object({ domain: z.string(), count: z.number() })
          ),
          topFavoriteColors: z.array(
            z.object({ color: z.string(), count: z.number() })
          ),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const users = getUsers();
        const emailDomains = new Map<string, number>();
        const colors = new Map<string, number>();
        let activeCount = 0;
        let inactiveCount = 0;
        let withColorCount = 0;

        for (const user of users) {
          const domain = user.email.split("@")[1] ?? "unknown";
          emailDomains.set(domain, (emailDomains.get(domain) ?? 0) + 1);

          if (user.isActive) {
            activeCount++;
          } else {
            inactiveCount++;
          }

          if (user.favoriteColor) {
            withColorCount++;
            const colorLower = user.favoriteColor.toLowerCase();
            colors.set(colorLower, (colors.get(colorLower) ?? 0) + 1);
          }
        }

        const topDomains = Array.from(emailDomains.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([domain, count]) => ({ domain, count }));

        const topColors = Array.from(colors.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([color, count]) => ({ color, count }));

        return successContent({
          totalUsers: users.length,
          activeUsers: activeCount,
          inactiveUsers: inactiveCount,
          usersWithFavoriteColor: withColorCount,
          topEmailDomains: topDomains,
          topFavoriteColors: topColors,
        });
      } catch (error) {
        return errorContent(
          "GET_STATS_FAILED",
          error instanceof Error ? error.message : "Failed to get stats"
        );
      }
    }
  );

  mcpServer.registerTool(
    "bulk-create-users",
    {
      title: "Bulk Create Users",
      description:
        "Create multiple users at once. Returns the list of created users.",
      inputSchema: {
        users: z.array(
          z.object({
            name: z.string(),
            email: z.string(),
            address: z.string(),
            phone: z.string(),
            favoriteColor: z.string().optional(),
          })
        ),
      },
      outputSchema: successSchema(
        z.object({
          created: z.array(UserSchema),
          createdCount: z.number(),
          skipped: z.array(z.object({ email: z.string(), reason: z.string() })),
          skippedCount: z.number(),
        })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const existingUsers = getUsers();
        const existingEmails = new Set(
          existingUsers.map((u) => u.email.toLowerCase())
        );
        const created: User[] = [];
        const skipped: Array<{ email: string; reason: string }> = [];
        let nextId =
          existingUsers.reduce((max, u) => Math.max(max, u.id ?? 0), 0) + 1;

        for (const userData of params.users) {
          if (existingEmails.has(userData.email.toLowerCase())) {
            skipped.push({
              email: userData.email,
              reason: "Email already exists",
            });
            continue;
          }
          const newUser: User = {
            id: nextId++,
            name: userData.name,
            email: userData.email,
            address: userData.address,
            phone: userData.phone,
            favoriteColor: userData.favoriteColor,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          existingUsers.push(newUser);
          existingEmails.add(userData.email.toLowerCase());
          created.push(newUser);
        }

        await saveUsers(existingUsers);

        return successContent({
          created,
          createdCount: created.length,
          skipped,
          skippedCount: skipped.length,
        });
      } catch (error) {
        return errorContent(
          "BULK_CREATE_FAILED",
          error instanceof Error ? error.message : "Failed to create users"
        );
      }
    }
  );

  mcpServer.registerTool(
    "set-user-active-status",
    {
      title: "Set User Active Status",
      description:
        "Set a user's active or inactive status. Returns the updated user.",
      inputSchema: {
        id: z.number(),
        isActive: z.boolean(),
      },
      outputSchema: successSchema(
        z.object({
          user: UserSchema,
          action: z.enum(["activated", "deactivated"]),
        })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const index = users.findIndex((u) => u.id === params.id);
        if (index === -1) {
          return errorContent(
            "USER_NOT_FOUND",
            `User with id ${params.id} not found`
          );
        }
        users[index].isActive = params.isActive;
        await saveUsers(users);
        return successContent({
          user: users[index],
          action: params.isActive
            ? ("activated" as const)
            : ("deactivated" as const),
        });
      } catch (error) {
        return errorContent(
          "SET_STATUS_FAILED",
          error instanceof Error ? error.message : "Failed to set user status"
        );
      }
    }
  );

  mcpServer.registerTool(
    "get-active-users",
    {
      title: "Get Active Users",
      description: "Get all active users from the database.",
      outputSchema: successSchema(
        z.object({
          users: z.array(UserSchema),
          count: z.number(),
          totalUsers: z.number(),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const users = getUsers();
        const activeUsers = users.filter((u) => u.isActive);
        return successContent({
          users: activeUsers,
          count: activeUsers.length,
          totalUsers: users.length,
        });
      } catch (error) {
        return errorContent(
          "GET_ACTIVE_USERS_FAILED",
          error instanceof Error ? error.message : "Failed to get active users"
        );
      }
    }
  );

  mcpServer.registerTool(
    "get-inactive-users",
    {
      title: "Get Inactive Users",
      description: "Get all inactive users from the database.",
      outputSchema: successSchema(
        z.object({
          users: z.array(UserSchema),
          count: z.number(),
          totalUsers: z.number(),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const users = getUsers();
        const inactiveUsers = users.filter((u) => !u.isActive);
        return successContent({
          users: inactiveUsers,
          count: inactiveUsers.length,
          totalUsers: users.length,
        });
      } catch (error) {
        return errorContent(
          "GET_INACTIVE_USERS_FAILED",
          error instanceof Error
            ? error.message
            : "Failed to get inactive users"
        );
      }
    }
  );

  mcpServer.registerTool(
    "set-user-favorite-color",
    {
      title: "Set User Favorite Color",
      description: "Set or clear a user's favorite color. Pass null to clear.",
      inputSchema: {
        id: z.number(),
        color: z.string().nullable(),
      },
      outputSchema: successSchema(
        z.object({
          user: UserSchema,
          previousColor: z.string().nullable(),
          newColor: z.string().nullable(),
        })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const index = users.findIndex((u) => u.id === params.id);
        if (index === -1) {
          return errorContent(
            "USER_NOT_FOUND",
            `User with id ${params.id} not found`
          );
        }
        const previousColor = users[index].favoriteColor;
        users[index].favoriteColor = params.color ?? undefined;
        await saveUsers(users);
        return successContent({
          user: users[index],
          previousColor: previousColor ?? null,
          newColor: params.color,
        });
      } catch (error) {
        return errorContent(
          "SET_COLOR_FAILED",
          error instanceof Error
            ? error.message
            : "Failed to set favorite color"
        );
      }
    }
  );

  mcpServer.registerTool(
    "get-users-by-favorite-color",
    {
      title: "Get Users By Favorite Color",
      description: "Find all users with a specific favorite color.",
      inputSchema: {
        color: z.string(),
      },
      outputSchema: successSchema(
        z.object({
          users: z.array(UserSchema),
          count: z.number(),
          color: z.string(),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const colorLower = params.color.toLowerCase();
        const matches = users.filter(
          (u) => u.favoriteColor?.toLowerCase() === colorLower
        );
        return successContent({
          users: matches,
          count: matches.length,
          color: params.color,
        });
      } catch (error) {
        return errorContent(
          "GET_BY_COLOR_FAILED",
          error instanceof Error
            ? error.message
            : "Failed to get users by color"
        );
      }
    }
  );

  mcpServer.registerTool(
    "export-users-csv",
    {
      title: "Export Users CSV",
      description: "Export all users as a CSV formatted string.",
      inputSchema: {
        includeInactive: z.boolean().optional(),
      },
      outputSchema: successSchema(
        z.object({
          csv: z.string(),
          rowCount: z.number(),
          includesInactive: z.boolean(),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const allUsers = getUsers();
        const users = params.includeInactive
          ? allUsers
          : allUsers.filter((u) => u.isActive);

        const headers = [
          "id",
          "name",
          "email",
          "address",
          "phone",
          "favoriteColor",
          "isActive",
          "createdAt",
        ];
        const escapeCSV = (val: string | number | boolean | undefined) => {
          if (val === undefined) return "";
          const str = String(val);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        const rows = users.map((u) =>
          [
            u.id,
            u.name,
            u.email,
            u.address,
            u.phone,
            u.favoriteColor,
            u.isActive,
            u.createdAt,
          ]
            .map(escapeCSV)
            .join(",")
        );
        const csv = [headers.join(","), ...rows].join("\n");

        return successContent({
          csv,
          rowCount: users.length,
          includesInactive: params.includeInactive ?? false,
        });
      } catch (error) {
        return errorContent(
          "EXPORT_CSV_FAILED",
          error instanceof Error ? error.message : "Failed to export users"
        );
      }
    }
  );

  mcpServer.registerTool(
    "validate-email-format",
    {
      title: "Validate Email Format",
      description:
        "Check if an email address has a valid format (does not check if it exists).",
      inputSchema: {
        email: z.string(),
      },
      outputSchema: successSchema(
        z.object({
          email: z.string(),
          isValid: z.boolean(),
          domain: z.string().nullable(),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(params.email);
        const domain = params.email.includes("@")
          ? params.email.split("@")[1]
          : null;
        return successContent({
          email: params.email,
          isValid,
          domain: domain ?? null,
        });
      } catch (error) {
        return errorContent(
          "VALIDATE_EMAIL_FAILED",
          error instanceof Error ? error.message : "Failed to validate email"
        );
      }
    }
  );

  mcpServer.registerTool(
    "clone-user",
    {
      title: "Clone User",
      description:
        "Create a copy of an existing user with a new email address.",
      inputSchema: {
        sourceId: z.number(),
        newEmail: z.string(),
        newName: z.string().optional(),
      },
      outputSchema: successSchema(
        z.object({
          clonedUser: UserSchema,
          sourceUser: UserSchema,
        })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const source = users.find((u) => u.id === params.sourceId);
        if (!source) {
          return errorContent(
            "USER_NOT_FOUND",
            `Source user with id ${params.sourceId} not found`
          );
        }
        const emailExists = users.some(
          (u) => u.email.toLowerCase() === params.newEmail.toLowerCase()
        );
        if (emailExists) {
          return errorContent(
            "EMAIL_EXISTS",
            `Email ${params.newEmail} is already in use`
          );
        }
        const nextId =
          users.reduce((max, u) => Math.max(max, u.id ?? 0), 0) + 1;
        const cloned: User = {
          id: nextId,
          name: params.newName ?? source.name,
          email: params.newEmail,
          address: source.address,
          phone: source.phone,
          favoriteColor: source.favoriteColor,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        users.push(cloned);
        await saveUsers(users);
        return successContent({
          clonedUser: cloned,
          sourceUser: source,
        });
      } catch (error) {
        return errorContent(
          "CLONE_USER_FAILED",
          error instanceof Error ? error.message : "Failed to clone user"
        );
      }
    }
  );

  mcpServer.registerTool(
    "deactivate-users-by-domain",
    {
      title: "Deactivate Users By Domain",
      description: "Deactivate all users with emails from a specific domain.",
      inputSchema: {
        domain: z.string(),
      },
      outputSchema: successSchema(
        z.object({
          domain: z.string(),
          deactivated: z.array(UserSchema),
          deactivatedCount: z.number(),
          alreadyInactiveCount: z.number(),
        })
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const domainLower = params.domain.toLowerCase();
        const deactivated: User[] = [];
        const alreadyInactive: User[] = [];

        for (const user of users) {
          const userDomain = user.email.split("@")[1]?.toLowerCase();
          if (userDomain === domainLower) {
            if (user.isActive) {
              user.isActive = false;
              deactivated.push(user);
            } else {
              alreadyInactive.push(user);
            }
          }
        }

        await saveUsers(users);

        return successContent({
          domain: params.domain,
          deactivated,
          deactivatedCount: deactivated.length,
          alreadyInactiveCount: alreadyInactive.length,
        });
      } catch (error) {
        return errorContent(
          "DEACTIVATE_BY_DOMAIN_FAILED",
          error instanceof Error ? error.message : "Failed to deactivate users"
        );
      }
    }
  );

  mcpServer.registerTool(
    "get-users-created-after",
    {
      title: "Get Users Created After",
      description: "Get all users created after a specific date.",
      inputSchema: {
        date: z.string(),
        includeInactive: z.boolean().optional(),
      },
      outputSchema: successSchema(
        z.object({
          users: z.array(UserSchema),
          count: z.number(),
          afterDate: z.string(),
        })
      ),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const users = getUsers();
        const afterDate = new Date(params.date);
        if (isNaN(afterDate.getTime())) {
          return errorContent(
            "INVALID_DATE",
            `Invalid date format: ${params.date}`
          );
        }
        const filtered = users.filter((u) => {
          const createdAt = new Date(u.createdAt);
          const afterFilter = createdAt > afterDate;
          const activeFilter = params.includeInactive ? true : u.isActive;
          return afterFilter && activeFilter;
        });
        return successContent({
          users: filtered,
          count: filtered.length,
          afterDate: afterDate.toISOString(),
        });
      } catch (error) {
        return errorContent(
          "GET_USERS_AFTER_FAILED",
          error instanceof Error ? error.message : "Failed to get users"
        );
      }
    }
  );
}
