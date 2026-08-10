export default function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "input-field";
