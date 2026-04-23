import { useEffect, useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import "./MetricCards.css";

const AppealKpiCard = ({
  title,
  value,
  suffix = "",
  description,
  footer,
  trend,
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

  const hasTrend = trend === "up" || trend === "down" || trend === "same";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <article className={`appeal-kpi-card ${tone} ${hasTrend ? "has-trend" : ""}`}>
      <div className="kpi-card-main-col">
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
      </div>

      {hasTrend && (
        <aside className="kpi-card-trend-col" aria-label={`Trend ${trend}`}>
          <span className="kpi-trend-separator" aria-hidden="true" />
          <span className={`kpi-trend-icon ${trend}`} aria-hidden="true">
            <TrendIcon />
          </span>
        </aside>
      )}
    </article>
  );
};

export default AppealKpiCard;