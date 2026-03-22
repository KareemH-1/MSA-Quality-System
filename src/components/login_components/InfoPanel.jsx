import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MotionDiv = motion.div;

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
  const [direction, setDirection] = useState(1);

  const getXnew = (isEntering, isExiting) => {
    if (direction > 0) {
      if (isEntering) {
        return -12;
      }

      if (isExiting) {
        return 12;
      }
    }

    if (isEntering) {
      return 12;
    }

    if (isExiting) {
      return -12;
    }

    return 0;
  };

  const getBarClassName = (barIndex) => {
    if (barIndex === index) {
      return "bar current";
    }

    return "bar";
  };

  const next = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % content.length);
  };

  const prev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + content.length) % content.length);
  };

  const selectSlide = (targetIndex) => {
    setDirection(targetIndex > index ? 1 : -1);
    setIndex(targetIndex);
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

        <AnimatePresence mode="wait" custom={direction}>
          <MotionDiv
            className="info-slide"
            key={index}
            custom={direction}
            initial={{ opacity: 0, y: 8, x: getXnew(true, false) }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -6, x: getXnew(false, true) }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h3>{content[index].title}</h3>
            <p>{content[index].description}</p>
          </MotionDiv>
        </AnimatePresence>

        <div className="changeInfo">
          {content.map((_, i) => (
            <div
              key={i}
              className={getBarClassName(i)}
              onClick={() => selectSlide(i)}
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