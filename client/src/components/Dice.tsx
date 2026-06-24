interface DiceProps {
  value: number | null;
  rolling: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function Dice({ value, rolling, disabled = false, onClick }: DiceProps) {
  return (
    <button
      className={`dice ${rolling ? "diceRolling" : ""}`}
      aria-label="Dice"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="diceFace">{rolling ? "?" : value ?? "-"}</span>
      <span className="diceLabel">ROLL</span>
    </button>
  );
}
