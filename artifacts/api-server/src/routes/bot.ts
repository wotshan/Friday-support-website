import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, botActivityTable, botSettingsTable } from "@workspace/db";
import {
  ExecuteBotCommandBody,
  ExecuteBotCommandResponse,
  GetBotActivityResponse,
  GetBotAnalyticsResponse,
  GetBotSummaryResponse,
  UpdateBotStatusBody,
  UpdateBotStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const baseActivities = [
  {
    id: "activity-001",
    message: "Friday connected to your workspace",
    status: "success",
    service: "runtime",
  },
  {
    id: "activity-002",
    message: "Memory index synchronized",
    status: "success",
    service: "memory",
  },
  {
    id: "activity-003",
    message: "Webhook listener ready",
    status: "pending",
    service: "webhooks",
  },
  {
    id: "activity-004",
    message: "Response policy updated",
    status: "success",
    service: "policy",
  },
];

async function ensureRuntime() {
  await db
    .insert(botSettingsTable)
    .values({ id: 1, status: "online" })
    .onConflictDoNothing();

  const existing = await db.select({ id: botActivityTable.id }).from(botActivityTable).limit(1);
  if (existing.length === 0) {
    await db.insert(botActivityTable).values(baseActivities);
  }
}

function labelForStatus(status: string) {
  return status === "online" ? "Online" : status === "idle" ? "Idle" : "Offline";
}

router.get("/bot/summary", async (_req, res): Promise<void> => {
  await ensureRuntime();
  const [settings] = await db.select().from(botSettingsTable).where(eq(botSettingsTable.id, 1));
  if (!settings) {
    res.status(500).json({ error: "Bot runtime unavailable" });
    return;
  }

  const data = GetBotSummaryResponse.parse({
    status: {
      status: settings.status,
      label: labelForStatus(settings.status),
      updatedAt: settings.updatedAt.toISOString(),
    },
    totalRequests: 128492,
    activeSessions: 384,
    responseLatency: 182,
    successRate: 99.7,
    deployedAt: "2026-09-12T09:30:00.000Z",
  });
  res.json(data);
});

router.get("/bot/analytics", async (_req, res): Promise<void> => {
  const data = GetBotAnalyticsResponse.parse({
    points: [
      { label: "Mon", requests: 14200, successes: 14080 },
      { label: "Tue", requests: 17800, successes: 17640 },
      { label: "Wed", requests: 15900, successes: 15780 },
      { label: "Thu", requests: 21300, successes: 21190 },
      { label: "Fri", requests: 23600, successes: 23470 },
      { label: "Sat", requests: 19800, successes: 19720 },
      { label: "Sun", requests: 25892, successes: 25790 },
    ],
    channels: [
      { name: "Web", value: 52, color: "#8b8cff" },
      { name: "API", value: 31, color: "#69d6ff" },
      { name: "Slack", value: 17, color: "#b1b6c6" },
    ],
  });
  res.json(data);
});

router.get("/bot/activity", async (_req, res): Promise<void> => {
  await ensureRuntime();
  const activities = await db
    .select()
    .from(botActivityTable)
    .orderBy(desc(botActivityTable.timestamp))
    .limit(12);
  res.json(
    GetBotActivityResponse.parse(
      activities.map((activity) => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(),
      })),
    ),
  );
});

router.patch("/bot/status", async (req, res): Promise<void> => {
  const parsed = UpdateBotStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await ensureRuntime();
  const [settings] = await db
    .update(botSettingsTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(botSettingsTable.id, 1))
    .returning();
  if (!settings) {
    res.status(500).json({ error: "Bot runtime unavailable" });
    return;
  }

  const now = new Date();
  await db.insert(botActivityTable).values({
    id: crypto.randomUUID(),
    timestamp: now,
    message: `Bot status changed to ${labelForStatus(settings.status)}`,
    status: "success",
    service: "runtime",
  });

  res.json(
    UpdateBotStatusResponse.parse({
      status: settings.status,
      label: labelForStatus(settings.status),
      updatedAt: settings.updatedAt.toISOString(),
    }),
  );
});

router.post("/bot/commands", async (req, res): Promise<void> => {
  const parsed = ExecuteBotCommandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await ensureRuntime();
  const labels: Record<string, string> = {
    restart: "Runtime restarted successfully",
    sync_memory: "Memory index is up to date",
    deploy: "New bot version deployed",
    webhook: "Webhook test accepted",
  };
  const command = parsed.data.command;
  const now = new Date();

  await db.insert(botActivityTable).values({
    id: crypto.randomUUID(),
    timestamp: now,
    message: labels[command],
    status: "success",
    service: command === "sync_memory" ? "memory" : command === "webhook" ? "webhooks" : "runtime",
  });

  res.json(
    ExecuteBotCommandResponse.parse({
      command,
      accepted: true,
      message: labels[command],
      executedAt: now.toISOString(),
    }),
  );
});

export default router;