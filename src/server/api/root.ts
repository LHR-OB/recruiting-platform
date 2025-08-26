import { messagesRouter } from "~/server/api/routers/messages";
import { teamsRouter } from "~/server/api/routers/teams";
import { systemsRouter } from "~/server/api/routers/systems";
import { usersRouter } from "~/server/api/routers/users"; // Added import
import { applicationsRouter } from "~/server/api/routers/applications";
import { availabilitiesRouter } from "~/server/api/routers/availabilities";
import { interviewsRouter } from "~/server/api/routers/interviews";
import { interviewNotesRouter } from "~/server/api/routers/interviewNotes";
import { eventsRouter } from "~/server/api/routers/events";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { faqRouter } from "./routers/faq";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  teams: teamsRouter,
  systems: systemsRouter,
  users: usersRouter, // Added usersRouter
  applications: applicationsRouter,
  availabilities: availabilitiesRouter,
  interviews: interviewsRouter, // <-- already present
  interviewNotes: interviewNotesRouter, // <-- already present
  events: eventsRouter, // <-- ADD THIS
  faq: faqRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
