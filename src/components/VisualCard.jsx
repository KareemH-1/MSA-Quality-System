export const VisualCard = ({ title, description, category }) => {
return (
  <div className="visual-card">
    

    <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{title}</h2>
    
    <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
      {description}
    </p>
    
    <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px'}}>
    <div className="accent-line"></div>
    <span style={{ fontSize: '0.8rem', letterSpacing: '2px', opacity: 0.8 , marginBottom: '7px'}}>
      {category.toUpperCase()}
    </span>
    </div>
  </div>
);
};