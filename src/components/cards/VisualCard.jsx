import { useEffect, useState } from "react";

export const VisualCard = ({ title, percentage, description, value, footer, icon, color , maxWidth , borderRadius, animationDuration = 1000}) => {
  let showIconInFooter = false;
  if (percentage && icon) {
    showIconInFooter = true;
  }

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

  const shouldAnimateValue = !Number.isNaN(parsedNumericValue);
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

  let initialDisplayValue = rawValue;
  if (shouldAnimateValue) {
    initialDisplayValue = 0;
  }

  const [displayValue, setDisplayValue] = useState(initialDisplayValue);

  useEffect(() => {
    if (!shouldAnimateValue) {
      return;
    }

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
  }, [shouldAnimateValue, parsedNumericValue, animationDuration]);

  let formattedValue = displayValue;
  if (shouldAnimateValue) {
    formattedValue = Number(displayValue).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces,
    });
  }
  
  let cardStyle = {};
  if (borderRadius !== undefined && borderRadius !== null) {
    if (typeof borderRadius === 'number') {
      cardStyle.borderRadius = `${borderRadius}px`;
    } else {
      cardStyle.borderRadius = borderRadius;
    }
  }
  if (maxWidth !== undefined && maxWidth !== null) {
    if (typeof maxWidth === 'number') {
      cardStyle.maxWidth = `${maxWidth}px`;
    } else {
      cardStyle.maxWidth = maxWidth;
    }
  }

  let cardClassName = 'visual-card dark';
  if (color === 'white') {
    cardClassName = 'visual-card white';
  }

  let percentageClassName = 'Perf negative';
  if (percentage && percentage.startsWith('+')) {
    percentageClassName = 'Perf positive';
  }


  return (
    <div className={cardClassName} style={cardStyle}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {percentage ? <h4 className={percentageClassName}>{percentage}</h4> : null}
        {!percentage && icon ? <div className="card-icon">{icon}</div> : null}
      </div>
      
      <h1 className="card-value">{formattedValue}</h1>
      <div className="card-description">
        <p>{description}</p>
      </div>
      <div className="card-footer">
        {footer ? <p>{footer}</p> : null}
        {showIconInFooter ? <div className="card-icon">{icon}</div> : null}
      </div>
    </div>
  );
}