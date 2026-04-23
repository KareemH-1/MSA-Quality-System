import { useEffect, useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import "./MetricCards.css";

const MiniMetricCard = ({
  label,
  value,
  suffix = "",
  description,
  trend,
  tone = "cool",
  animationDuration = 900,
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
    <article className={`mini-metric-card ${tone} ${hasTrend ? "has-trend" : ""}`}>
      <div className="kpi-card-main-col">
        <p className="mini-metric-label">{label}</p>
        <h3 className="mini-metric-value">
          {displayValue}
          {suffix}
        </h3>
        <p className="mini-metric-description">{description}</p>
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

export default MiniMetricCard;
