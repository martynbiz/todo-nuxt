import { ref } from 'vue'

interface ConfirmOptions {
  message: string
  confirmLabel?: string
}

const pending = ref<{
  message: string
  confirmLabel: string
  resolve: (value: boolean) => void
} | null>(null)

let triggerEl: HTMLElement | null = null

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    triggerEl = document.activeElement as HTMLElement
    return new Promise((resolve) => {
      pending.value = {
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Delete',
        resolve,
      }
    })
  }

  function respond(value: boolean) {
    pending.value?.resolve(value)
    pending.value = null
    triggerEl?.focus()
    triggerEl = null
  }

  return { confirm, respond, pending }
}
