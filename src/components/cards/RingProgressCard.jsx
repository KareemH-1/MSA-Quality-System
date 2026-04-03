import { useEffect, useMemo, useState } from "react";
import "./MetricCards.css";

const RingProgressCard = ({
  title,
  value,
  maxValue = 100,
  suffix = "%",
  note,
  animationDuration = 1000,
}) => {
  const numericValue = Number(value);
  const safeMax = Number(maxValue) > 0 ? Number(maxValue) : 100;
  const clampedValue = Math.max(0, Math.min(safeMax, numericValue));
  const shouldAnimate = Number.isFinite(clampedValue);

  const [animatedValue, setAnimatedValue] = useState(shouldAnimate ? 0 : value);

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }

    let animationFrameId;
    let animationStartTime;

    const animate = (timeStamp) => {
      if (!animationStartTime) {
        animationStartTime = timeStamp;
      }

      const elapsed = timeStamp - animationStartTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const nextValue = clampedValue * progress;

      setAnimatedValue(nextValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [shouldAnimate, clampedValue, animationDuration]);

  const circleRadius = 32;
  const circleLength = useMemo(() => 2 * Math.PI * circleRadius, [circleRadius]);
  const progressPercent = shouldAnimate ? Number(animatedValue) / safeMax : 0;
  const strokeOffset = circleLength * (1 - progressPercent);

  const displayValue = shouldAnimate
    ? Number(animatedValue).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: Number.isInteger(clampedValue) ? 0 : 1,
      })
    : value;

  return (
    <article className="ring-progress-card">
      <p className="ring-progress-title">{title}</p>
      <div className="ring-progress-body">
        <svg viewBox="0 0 84 84" className="ring-svg" aria-hidden="true">
          <circle className="ring-track" cx="42" cy="42" r={circleRadius} />
          <circle
            className="ring-fill"
            cx="42"
            cy="42"
            r={circleRadius}
            strokeDasharray={circleLength}
            strokeDashoffset={strokeOffset}
          />
        </svg>

        <h3 className="ring-progress-value">
          {displayValue}
          {suffix}
        </h3>
      </div>
      <p className="ring-progress-note">{note}</p>
    </article>
  );
};

export default RingProgressCard;
