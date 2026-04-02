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
  const rawValue = value ?? "N/A";
  const parsedNumericValue =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string"
        ? Number(rawValue.replace(/,/g, ""))
        : Number.NaN;

  const shouldAnimateValue = Number.isFinite(parsedNumericValue);
  const decimalPlaces = Number.isInteger(parsedNumericValue)
    ? 0
    : (() => {
        const stringValue = String(rawValue);
        const decimalPart = stringValue.split(".")[1];
        return decimalPart ? decimalPart.length : 1;
      })();

  const clampedProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  const [displayValue, setDisplayValue] = useState(
    shouldAnimateValue ? 0 : rawValue
  );
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
        setDisplayValue(nextValue);
      }

      if (phase < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (!shouldAnimateValue) {
      setDisplayValue(rawValue);
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [clampedProgress, animationDuration, shouldAnimateValue, parsedNumericValue, rawValue]);

  const formattedValue = shouldAnimateValue
    ? Number(displayValue).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimalPlaces,
      })
    : rawValue;
  const resolvedColor = color === "dark" ? "dark" : "white";

  const TrendIcon = trendDirection === "down" ? TrendingDown : TrendingUp;
  const HeaderIcon = icon || TrendIcon;

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
            <p className={`bar-card-trend ${trendDirection === "down" ? "down" : "up"}`}>
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
