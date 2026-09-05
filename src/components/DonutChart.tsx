export function DonutChart({ normal, warning, critical }: { normal: number; warning: number; critical: number }) {
  const total = Math.max(normal + warning + critical, 1);
  const normalPct = normal / total * 100;
  const warningPct = warning / total * 100;
  const warningEnd = normalPct + warningPct;
  const style = {
    background: `conic-gradient(var(--success) 0 ${normalPct}%, var(--warning) ${normalPct}% ${warningEnd}%, var(--danger) ${warningEnd}% 100%)`
  };
  return (
    <div className="donut-wrap">
      <div className="donut" style={style} aria-label={`${normal} normal, ${warning} warning, ${critical} critical`}>
        <div className="donut__center"><strong>{total}</strong><span>vehicles</span></div>
      </div>
      <div className="donut-legend">
        <div><span className="dot dot--success" />Normal <strong>{normal}</strong></div>
        <div><span className="dot dot--warning" />Needs review <strong>{warning}</strong></div>
        <div><span className="dot dot--danger" />Emergency <strong>{critical}</strong></div>
      </div>
    </div>
  );
}
