const Interview = ({ team, name }: { team: string; name: string }) => {
  return (
    <div>
      {team === "Combustion" && (
        <p>
          Dear {name},<br />
          <br /> Congratulations! We have been very impressed by your
          application and have decided to offer you an interview! Please visit
          our recruitment website to view the system(s) that have extended an
          interview and select a single system to proceed with. You will have
          the option to select a time to schedule this 30-minute interview,
          which will be in person in the Engineering Teaching Center (ETC)
          lobby. We hope to see you again during your interview and please reach
          out to recruitment@longhornracing if you have any questions!
          <br />
          <br />
          Sincerely,
          <br />
          <br /> Leo Cheong
        </p>
      )}
      {team === "Electric" && (
        <p>
          Hello {name},
          <br />
          <br /> Thank you for interviewing with Longhorn Racing Electric. We
          were very impressed by our conversation and would like to extend an
          invitation to our trial workday this Sunday, September 7th from
          10:00am to 2:00pm in ETC 2.126. This trial workday is an excellent
          chance to learn more about what we do weekly and talk to our members
          in a more hands-on setting. We look forward to seeing you there!
          Sincerely,
          <br />
          <br />
          Tyler Yan,
          <br />
          <br />
          LHRe Team Captain
        </p>
      )}
      {team === "Solar" && (
        <p>
          Dear <br />
          <br />, Congratulations! You have been accepted into the next stage of
          the application process for Longhorn Racing Solar. We have reviewed
          your written application and have decided to move you forward to the
          interviewing process for the following systems: ________. <br />
          <br /> Should you choose to accept this, you will be interviewed for
          30 minutes by two members of our team. <br />
          <br />
          Please check your recruitment portal for more information and submit a
          time slot as soon as possible. <br />
          <br /> Thank you! We look forward to getting to know you better.
          Please let us know if you have questions or need clarification by
          messaging recruitment@longhornracing.com. <br />
          <br />
          Best, <br />
          <br />
          Kayla Lee <br />
          <br />
          Longhorn Racing Solar Team Captain
        </p>
      )}
    </div>
  );
};

export default Interview;
