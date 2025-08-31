import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const Interview = ({
  team,
  name,
  appId,
}: {
  team: string;
  name: string;
  appId: string;
}) => {
  return (
    <div>
      {team === "Combustion" && (
        <p>
          Dear {name},<br />
          <br /> Congratulations! We have been very impressed by your
          application and have decided to offer you an interview! Please follow the link below
          to view the system(s) that have extended an
          interview and select a single system to proceed with. You will have
          the option to select a time to schedule this 30-minute interview,
          which will be in person in the Engineering Teaching Center (ETC)
          lobby. We hope to see you again during your interview and please reach
          out to longhornracingrecruitment@gmail.com if you have any questions!
          <br /><br />
          <Link
            className={cn(buttonVariants({ size: "sm" }), "mt-1")}
            href={`/interview?applicationId=${appId}`}
          >
            Schedule Interview
          </Link>
          <br />
          <br />
          Sincerely,
          <br />
          <br /> Leo Cheong

          <br />
          <br />
          <br />
          <i>
            You will see which systems you have been invited to interview with
            once you go to schedule an interview.
            If you do not have the ability to schedule an interview for another system you have applied for,
            you have not been extended an interview invite for that system. As a reminder,
            you can interview for only one system on Combustion.
            <br /><br />
            Please schedule your interview at least 12 hours in advance of the interview time, otherwise it will be rescheduled.
            All Combustion interviews will be at the ETC.
            There will be a check-in table and/or signs to guide you.
          </i>
        </p>
      )}
      {team === "Electric" && (
        <p>
          Congratulations, {name}! <br /><br />

          After reviewing your application, we’re excited to invite you to
          interview for Longhorn Racing Electric. Please follow the link
          below to reserve an interview time with your designated system.
          We look forward to meeting you! <br /><br />
          <Link
            className={cn(buttonVariants({ size: "sm" }), "mt-1")}
            href={`/interview?applicationId=${appId}`}
          >
            Schedule Interview
          </Link>
          <br /><br />

          Sincerely,<br />

          Tyler Yan <br />

          LHRe Team Captain

          <br />
          <br />
          <br />
          <i>
            You will see which systems you have been invited to interview with
            once you go to schedule an interview.
            If you do not have the ability to schedule an interview for another system you have applied for,
            you have not been extended an interview invite for that system. As a reminder,
            you can interview for only one system on Electric.
            <br /><br />
            Please schedule your interview at least 12 hours in advance of the interview time, otherwise it will be rescheduled.
            All Electric team interviews will take place in the EER (second floor entrance).
            There will be a check-in table and/or signs to guide you.
          </i>
        </p>
      )}
      {team === "Solar" && (
        <p>
          Dear {name}, <br />
          <br /> Congratulations! You have been accepted into the next stage of
          the application process for Longhorn Racing Solar. We have reviewed
          your written application and have decided to move you forward to the
          interviewing process for one or more systems. <br />
          <br /> Should you choose to accept this, you will be interviewed for
          30 minutes by two members of our team. <br />
          <br />
          Please schedule below! <br />
          <Link
            className={cn(buttonVariants({ size: "sm" }), "mt-1")}
            href={`/interview?applicationId=${appId}`}
          >
            Schedule Interview
          </Link>
          <br />
          <br /> Thank you! We look forward to getting to know you better.
          Please let us know if you have questions or need clarification by
          messaging recruitment@longhornracing.com. <br />
          <br />
          Best, <br />
          Kayla Lee <br />
          Longhorn Racing Solar Team Captain
          
          <br />
          <br />
          <br />
          <i>
            You will see which systems you have been invited to interview with
            once you go to schedule an interview.
            If you do not have the ability to schedule an interview for another system you have applied for,
            you have not been extended an interview invite for that system. As a reminder, you can interview
            for as many systems you get accepted for Solar.
            <br /><br />
            Please schedule your interview at least 12 hours in advance of the interview time, otherwise it will be rescheduled.
            All Solar interviews will be at the ETC.
            There will be a check-in table and/or signs to guide you.
          </i>
        </p>
      )}
    </div>
  );
};

export default Interview;
