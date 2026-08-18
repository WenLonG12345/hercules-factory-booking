import { createTRPCRouter } from "@/server/trpc";
import { cmsRouter } from "./cms";
import { coachRouter } from "./coach";
import { customerRouter } from "./customer";
import { invoiceRouter } from "./invoice";
import { ledgerRouter } from "./ledger";
import { packageRouter } from "./package";
import { packagePlanRouter } from "./package-plan";
import { reportRouter } from "./report";
import { scheduleRouter } from "./schedule";
import { trialRouter } from "./trial";

export const appRouter = createTRPCRouter({
  cms: cmsRouter,
  coach: coachRouter,
  customer: customerRouter,
  invoice: invoiceRouter,
  ledger: ledgerRouter,
  package: packageRouter,
  packagePlan: packagePlanRouter,
  report: reportRouter,
  schedule: scheduleRouter,
  trial: trialRouter,
});

export type AppRouter = typeof appRouter;
