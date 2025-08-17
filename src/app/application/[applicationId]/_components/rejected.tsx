const Rejected = ({ team, name }: { team: string; name: string }) => {
  return (
    <div>
      {team === "Electric" && (
        <p>
          Hello {name} <br /> <br />
          Thank you for your interest in Longhorn Racing Electric. After careful
          consideration, we’ve decided not to proceed with your application.
          This decision was not an easy one, as we received many strong
          applicants this year. We encourage you to reapply in future recruiting
          seasons and wish you the best in any other ongoing recruitment
          processes. <br />
          <br /> Sincerely, <br /> <br />
          Tyler Yan <br /> <br />
          LHRe Team Captain
        </p>
      )}
      {team === "Combustion" && (
        <p>
          Dear {name}, <br /> <br /> Thank you so much for your interest in the
          Longhorn Racing Combustion team. Unfortunately, after careful
          consideration, we are unable to move forward with your application at
          this time. Please understand that this is not a reflection on your
          talents, abilities, or personality; Longhorn racing has had an
          ever-increasing number of applicants every year and with that a harder
          decision to make in selecting new members. We hope that you enjoyed
          learning more about the team and you’ll reapply in the future! If you
          believe that you have received this email by mistake, please reach out
          to recruitment@longhornracing.
          <br /> <br /> Sincerely, <br /> <br />
          Leo Cheong
        </p>
      )}
      {team === "Solar" && (
        <p>
          Dear {name} <br />
          <br /> It is with genuine regret that I must tell you that you have
          not been selected as a member of Longhorn Racing Solar this year.
          <br />
          <br /> I know it is extremely frustrating to be rejected from a role
          for which you are perfectly qualified. We believe everyone who applied
          this semester has clearly shown themselves to be hardworking, driven,
          curious, intelligent, and passionate about engineering. I have no
          doubt that any one of you would have been an asset to our team. <br />
          <br />
          Each year we surpass our previous record for the number of unique
          applicants, and that means we are forced to make difficult decisions
          at every step of the process. At the end of the day, there are simply
          more qualified applicants than there are spots on each team. If you
          remain interested in being a member of LHRS, we urge you to reapply
          next year. <br />
          <br />
          Thank you very much for the time and effort you’ve put in thus far,
          and we wish you the best. <br />
          <br />
          Sincerely, <br />
          <br />
          Kayla Lee <br />
          <br />
          Longhorn Racing Solar Team Captain
        </p>
      )}
    </div>
  );
};

export default Rejected;
