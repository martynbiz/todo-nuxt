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

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
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
  }

  return { confirm, respond, pending }
}
