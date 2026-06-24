import { useEffect, useRef } from "react";

interface ConfirmBankruptcyModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmBankruptcyModal({
  isOpen,
  onCancel,
  onConfirm
}: ConfirmBankruptcyModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelButtonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="eventOverlay confirmOverlay" onClick={onCancel}>
      <article className="eventPopup bad confirmModal" onClick={(event) => event.stopPropagation()}>
        <button className="modalCloseButton" type="button" aria-label="关闭确认弹窗" onClick={onCancel}>
          X
        </button>
        <span className="eventHeadline">确认主动破产？</span>
        <h3>这一步不能撤销</h3>
        <p>
          主动破产后，你将退出本局竞争，无法继续掷骰子、购买地产、使用技能卡或参与股票结算。你仍然可以观战。
        </p>
        <div className="confirmActions">
          <button ref={cancelButtonRef} className="secondaryButton" type="button" onClick={onCancel}>
            取消
          </button>
          <button className="dangerButton" type="button" onClick={onConfirm}>
            确认破产
          </button>
        </div>
      </article>
    </div>
  );
}
