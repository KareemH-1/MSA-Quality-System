import { useEffect, useState } from "react";

export const VisualCard = ({ title, percentage, description, value, footer, icon, color , maxWidth , borderRadius}) => {
  const showIconInFooter = Boolean(percentage && icon);
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

  const [displayValue, setDisplayValue] = useState(
    shouldAnimateValue ? 0 : rawValue
  );

  useEffect(() => {
    if (!shouldAnimateValue) {
      return;
    }

    const animationDuration = 1000;
    const startValue = 0;
    const endValue = parsedNumericValue;
    let animationFrameId;
    let animationStartTime;

    const animateValue = (timeStamp) => {
      if (!animationStartTime) {
        animationStartTime = timeStamp;
      }

      const elapsed = timeStamp - animationStartTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const nextValue = startValue + (endValue - startValue) * progress;

      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateValue);
      }
    };

    animationFrameId = requestAnimationFrame(animateValue);

    return () => cancelAnimationFrame(animationFrameId);
  }, [shouldAnimateValue, parsedNumericValue]);

  const formattedValue = shouldAnimateValue
    ? Number(displayValue).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimalPlaces,
      })
    : displayValue;
  
  let cardStyle = {};
  if (borderRadius !== undefined && borderRadius !== null) {
    cardStyle.borderRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
  }
  if (maxWidth !== undefined && maxWidth !== null) {
    cardStyle.maxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  }


  return (
    <div className={`visual-card ${color === 'white' ? 'white' : 'dark'}`} style={cardStyle}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {percentage ? <h4 className={`Perf ${percentage.startsWith('+') ? 'positive' : 'negative'}`}>{percentage}</h4> : null}
        {!percentage && icon ? <div className="card-icon">{icon}</div> : null}
      </div>
      
      <h1 className="card-value">{formattedValue}</h1>
      <div className="card-description">
        <p>{description}</p>
      </div>
      <div className="card-footer">
        {footer && <p>{footer}</p>}
        {showIconInFooter ? <div className="card-icon">{icon}</div> : null}
      </div>
    </div>
  );
}