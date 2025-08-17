const Waitlist = ({ team, name }: { team: string; name: string }) => {
  return (
    <div>
      {team === "Solar" && (
        <p>
          Dear {name},<br />
          <br /> We hope this message finds you well. I am sorry to inform you
          that you have not been offered an immediate position on the LHR Solar
          team. However, you have been placed on the waitlist for the
          ___systems.
          <br />
          <br /> I would like to extend my appreciation to you for the efforts
          you have made to get this far in the process. We were thoroughly
          impressed by your energy and display of skills. I have no doubt that
          you would be a great addition to the team. Unfortunately, our
          organization’s competitive applicant pool continues to increase.
          <br />
          <br /> We hope to get back to you very soon so please look out for a
          follow up. Thank you again for your interest in our team. I know that
          this can be a very conflicting outcome. If you have any concerns or
          questions, please contact us at recruitment@longhornracing.com.
          <br />
          <br /> Best Regards, <br />
          <br /> Kayla Lee
          <br />
          <br /> Longhorn Racing Solar Team Captain
        </p>
      )}
      {team === "Electric" && (
        <p>
          Hello, and thank you for attending Longhorn Racing Electric’s Trial
          Workday! We greatly appreciate your time participating in our
          interview and selection process. Due to the competitive nature of this
          admissions cycle, and the limited number of available slots, we have
          temporarily placed your application on our waitlist. Thank you for
          your understanding, and rest assured that we will notify you tomorrow
          by 5 PM regarding any updates to your application. <br />
          <br /> Sincerely, <br />
          <br /> Tyler Yan <br />
          <br /> LHRe Team Captain
        </p>
      )}
      {team === "Combustion" && (
        <p>
          Dear {name}
          <br />
          <br />
          We appreciate the enthusiasm and effort you put into the recruitment
          process for the Longhorn Racing Combustion team. While we are
          currently not able to offer an invitation to join, we are pleased to
          let you know you have been placed on the waitlist for your system.
          Please visit our recruitment portal to view the status of your
          waitlist. As soon as a position opens on the system, you will receive
          an invitation to join the team. We hope that this does discourage you,
          as you have made it through the hardest application process on campus,
          an achievement you should be very proud of! If you have any questions
          or concerns, please reach out to recruitment@longhornracing.org.
          <br />
          <br />
          Sincerely,
          <br />
          <br />
          Leo Cheong
        </p>
      )}
    </div>
  );
};

export default Waitlist;
