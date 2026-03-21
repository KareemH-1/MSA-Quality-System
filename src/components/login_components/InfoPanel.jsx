import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const content = [
  {
    title: "Welcome to MSA Quality System",
    description:
      "Use this portal to access university Grade Appeals and Surveys. Manage your submissions, track progress, and stay informed about updates and announcements related to your activities and requests."
  },
  {
    title: "Access Services and Requests",
    description:
      "Find forms, submit requests, and follow required steps for student and staff processes across the university."
  },
  {
    title: "Track Updates and Progress",
    description:
      "Check announcements, follow status updates, and monitor progress for your submitted activities and actions."
  }
];

const InfoPanel = () => {
  const [index, setIndex] = useState(0);

  const next = () => {
    setIndex((prev) => (prev + 1) % content.length);
  };

  const prev = () => {
    setIndex((prev) => (prev - 1 + content.length) % content.length);
  };

  return (
    <div className="info-panel">
      <div className="background-gradient"></div>
      <div className="previous" onClick={prev}>
        <ChevronLeft />
      </div>

      <div className="info-panel_content">
        <div className="title-badge">
          <h2>MSA University</h2>
        </div>

        <div className="info-slide" key={index}>
          <h3>{content[index].title}</h3>
          <p>{content[index].description}</p>
        </div>

        <div className="changeInfo">
          {content.map((_, i) => (
            <div
              key={i}
              className={`bar ${i === index ? "current" : ""}`}
              onClick={() => setIndex(i)}
            ></div>
          ))}
        </div>
      </div>

      <div className="next" onClick={next}>
        <ChevronRight />
      </div>
    </div>
  );
};

export default InfoPanel;