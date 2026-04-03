import { useEffect, useState } from "react";
import { Target, TrendingDown, TrendingUp } from "lucide-react";
import "./BarCard.css";

const BarCard = ({
  title,
  value,
  valueSuffix = "",
  color = "white",
  trend,
  trendDirection = "up",
  target,
  progress = 0,
  barColorClass = "danger",
  icon,
  animationDuration = 1000,
}) => {
  let rawValue = "N/A";
  if (value !== undefined && value !== null) {
    rawValue = value;
  }

  let parsedNumericValue = Number.NaN;
  if (typeof rawValue === "number") {
    parsedNumericValue = rawValue;
  } else if (typeof rawValue === "string") {
    parsedNumericValue = Number(rawValue.replace(/,/g, ""));
  }

  const shouldAnimateValue = !Number.isNaN(parsedNumericValue) && parsedNumericValue !== Infinity && parsedNumericValue !== -Infinity;
  let decimalPlaces = 0;
  if (!Number.isInteger(parsedNumericValue)) {
    const stringValue = String(rawValue);
    const decimalPart = stringValue.split(".")[1];
    if (decimalPart) {
      decimalPlaces = decimalPart.length;
    } else {
      decimalPlaces = 1;
    }
  }

  const clampedProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  const [animatedValue, setAnimatedValue] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    let animationFrameId;
    let animationStartTime;
    const startProgress = 0;
    const endProgress = clampedProgress;
    const startValue = 0;
    const endValue = parsedNumericValue;

    const animate = (timeStamp) => {
      if (!animationStartTime) {
        animationStartTime = timeStamp;
      }

      const elapsed = timeStamp - animationStartTime;
      const phase = Math.min(elapsed / animationDuration, 1);
      const nextProgress = startProgress + (endProgress - startProgress) * phase;

      setAnimatedProgress(nextProgress);

      if (shouldAnimateValue) {
        const nextValue = startValue + (endValue - startValue) * phase;
        setAnimatedValue(nextValue);
      }

      if (phase < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [clampedProgress, animationDuration, shouldAnimateValue, parsedNumericValue, rawValue]);

  let displayValue = rawValue;
  if (shouldAnimateValue) {
    displayValue = animatedValue;
  }

  let formattedValue = displayValue;
  if (shouldAnimateValue) {
    formattedValue = Number(displayValue).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces,
    });
  }

  let resolvedColor = "white";
  if (color === "dark") {
    resolvedColor = "dark";
  }

  let TrendIcon = TrendingUp;
  if (trendDirection === "down") {
    TrendIcon = TrendingDown;
  }

  let HeaderIcon = TrendIcon;
  if (icon) {
    HeaderIcon = icon;
  }

  return (
    <article className={`bar-card ${resolvedColor}`}>
      <header className="bar-card-header">
        <h3 className="bar-card-title">{title}</h3>
      </header>

      <div className="bar-card-main">
        <h2 className="bar-card-value">
          {formattedValue}
          {valueSuffix}
        </h2>

        <div className="bar-card-meta">
          {trend ? (
            <p className={trendDirection === "down" ? "bar-card-trend down" : "bar-card-trend up"}>
              <HeaderIcon size={18} strokeWidth={2.2} />
              <span>{trend}</span>
            </p>
          ) : null}

          {target ? (
            <p className="bar-card-target">
              <Target size={16} strokeWidth={2} />
              <span>Target: {target}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="bar-card-track" aria-hidden="true">
        <span
          className={`bar-card-fill ${barColorClass}`}
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
    </article>
  );
};

export default BarCard;
