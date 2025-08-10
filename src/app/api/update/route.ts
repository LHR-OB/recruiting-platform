import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { applicationCycles, applications } from "~/server/db/schema";

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // Use 465 for SSL, 587 for TLS
  secure: false, // Set to true for port 465
  auth: {
    user: "longhornracingrecruitment@gmail.com", // Your Gmail address
    pass: "wdpj spbk ifsc lwir", // Your Gmail password or App Password
  },
});

const GET = async () => {
  // push stages when appriorate,
  // this cronjob should occur every day at 12am CST

  const now = new Date();

  // active cycles
  const cycles = await db.query.applicationCycles.findMany({
    where: (t, { gte, lte, and }) =>
      and(lte(t.startDate, now), gte(t.endDate, now)),
    with: {
      stages: true,
    },
  });

  for (const cycle of cycles) {
    for (const stage of cycle.stages) {
      if (
        stage.startDate <= now &&
        stage.endDate >= now &&
        stage.stage !== cycle.stage
      ) {
        const applicationsInStage = await db.query.applications.findMany({
          where: (a, { eq }) => eq(a.applicationCycleId, cycle.id),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              columns: {
                name: true,
              },
            },
          },
        });

        await Promise.all(
          applicationsInStage.map(async (application, i) => {
            if (application.status === application.internalDecision) {
              return;
            }

            await new Promise((resolve) => setTimeout(resolve, i * 500));

            const mailOptions = {
              from: "Longhorn Racing Recruitment <longhornracingrecruitment@gmail.com>",
              to: application.user.email,
              subject: `Application Update for ${application.team.name}`,

              text: `Hello ${application.user.name},\n\nYour application for the ${application.team.name} team has been updated.\n\nBest regards,\nLonghorn Racing Recruitment Team`,
            };

            await transporter.sendMail(mailOptions).catch((error) => {
              console.error("Error sending email:", error);
            });
          }),
        );

        await db.batch([
          db
            .update(applicationCycles)
            .set({
              stage: stage.stage,
            })
            .where(eq(applicationCycles.id, cycle.id)),
          db
            .update(applications)
            .set({
              status: sql`
                      CASE
                        WHEN ${applications.internalDecision} IS NOT NULL THEN ${applications.internalDecision}
                        ELSE 'REJECTED' -- Or another column, or NULL
                      END
                    `,
            })
            .where(eq(applications.applicationCycleId, cycle.id)),
        ]);
      }
    }
  }

  return new Response("Cron job completed successfully", {
    status: 200,
  });
};

export { GET };
