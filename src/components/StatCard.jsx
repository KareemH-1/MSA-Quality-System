import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, Users, AlertCircle } from "lucide-react"; 

const StatCard = ({ title, value, icon: Icon, trend, suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (start === end) return;

    let totalMiliseconds = 1000;
    let incrementTime = totalMiliseconds / end;

    let timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="visual-card"
      style={{ minWidth: '280px', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="accent-line"></div>
        {Icon && <Icon size={24} color="var(--secondary-color)" />}
      </div>

      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        style={{ fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}
      >
        {title}
      </motion.span>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <h2 className="tabular-nums" style={{ fontSize: '2.5rem', margin: 0 }}>
          {displayValue}{suffix}
        </h2>
        {trend && (
          <span style={{ color: 'var(--success-color)', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
            <TrendingUp /> {trend}%
          </span>
        )}
      </div>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginTop: '10px' }}
      />
    </motion.div>
  );
};

export default StatCard;