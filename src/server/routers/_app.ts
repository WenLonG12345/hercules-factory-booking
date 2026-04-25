import { createTRPCRouter } from "@/server/trpc";
import { attendanceRouter } from "./attendance";
import { bookingRouter } from "./booking";
import { cmsRouter } from "./cms";
import { customerRouter } from "./customer";
import { invoiceRouter } from "./invoice";
import { membershipRouter } from "./membership";
import { paymentRouter } from "./payment";
import { reportRouter } from "./report";
import { scheduleRouter } from "./schedule";

export const appRouter = createTRPCRouter({
  customer: customerRouter,
  membership: membershipRouter,
  schedule: scheduleRouter,
  booking: bookingRouter,
  attendance: attendanceRouter,
  invoice: invoiceRouter,
  payment: paymentRouter,
  report: reportRouter,
  cms: cmsRouter,
});

export type AppRouter = typeof appRouter;
