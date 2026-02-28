import { h } from "https://esm.sh/preact";
import { useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

export const ConfirmDialog = ({
  visible = false,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmTone = "primary",
}) => {
  useEffect(() => {
    if (!visible) return;

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [visible, onCancel]);

  if (!visible) return null;

  const confirmClass =
    confirmTone === "warning"
      ? "border border-yellow-500/45 text-yellow-300 bg-[linear-gradient(180deg,rgba(234,179,8,0.22)_0%,rgba(234,179,8,0.12)_100%)] shadow-[inset_0_0_0_1px_rgba(234,179,8,0.18)] hover:border-yellow-300/75 hover:text-yellow-200 hover:bg-[linear-gradient(180deg,rgba(234,179,8,0.3)_0%,rgba(234,179,8,0.16)_100%)] hover:shadow-[inset_0_0_0_1px_rgba(234,179,8,0.26),0_0_12px_rgba(234,179,8,0.16)]"
      : "ac-btn-cyan";

  return html`
    <div
      class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onclick=${(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <div class="bg-modal border border-border rounded-xl p-5 max-w-md w-full space-y-3">
        <h2 class="text-base font-semibold">${title}</h2>
        <p class="text-sm text-gray-400">${message}</p>
        <div class="pt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onclick=${onCancel}
            class="px-4 py-2 rounded-lg text-sm ac-btn-secondary"
          >
            ${cancelLabel}
          </button>
          <button
            type="button"
            onclick=${onConfirm}
            class="px-4 py-2 rounded-lg text-sm transition-all ${confirmClass}"
          >
            ${confirmLabel}
          </button>
        </div>
      </div>
    </div>
  `;
};
