import { useEffect, useState } from "react";
import "./MetricCards.css";

const AppealKpiCard = ({
  title,
  value,
  suffix = "",
  description,
  footer,
  tone = "neutral",
  animationDuration = 700,
}) => {
  const numericValue = Number(value);
  const shouldAnimate = Number.isFinite(numericValue);
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
      const nextValue = numericValue * progress;

      setAnimatedValue(nextValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [shouldAnimate, numericValue, animationDuration]);

  const displayValue = shouldAnimate
    ? Number(animatedValue).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: Number.isInteger(numericValue) ? 0 : 1,
      })
    : value;

  return (
    <article className={`appeal-kpi-card ${tone}`}>
      <header className="appeal-kpi-top">
        <p className="appeal-kpi-label">{title}</p>
      </header>

      <div className="appeal-kpi-main">
        <h3 className="appeal-kpi-value">
          {displayValue}
          <span className="appeal-kpi-suffix">{suffix}</span>
        </h3>
        <p className="appeal-kpi-description">{description}</p>
      </div>

      <footer className="appeal-kpi-bottom">
        <p className="appeal-kpi-footer">{footer}</p>
      </footer>
    </article>
  );
};

export default AppealKpiCard;