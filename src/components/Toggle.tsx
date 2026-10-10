export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      className={`toggle toggle--modern ${checked ? 'toggle--on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={`${label}: ${checked ? 'On' : 'Off'}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__state toggle__state--off">OFF</span>
        <span className="toggle__state toggle__state--on">ON</span>
        <span className="toggle__knob" />
      </span>
    </button>
  );
}
