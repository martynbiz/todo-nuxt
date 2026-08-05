import { ref } from 'vue'

interface ConfirmCheckboxOptions {
  label: string
  defaultChecked?: boolean
}

interface ConfirmOptions {
  message: string
  confirmLabel?: string
  checkbox?: ConfirmCheckboxOptions
}

const pending = ref<{
  message: string
  confirmLabel: string
  checkbox: ConfirmCheckboxOptions | null
  resolve: (value: boolean | { confirmed: boolean; checked: boolean }) => void
} | null>(null)

const checked = ref(false)

let triggerEl: HTMLElement | null = null

export function useConfirm() {
  function confirm(options: ConfirmOptions & { checkbox: ConfirmCheckboxOptions }): Promise<{ confirmed: boolean; checked: boolean }>
  function confirm(options: ConfirmOptions): Promise<boolean>
  function confirm(options: ConfirmOptions): Promise<boolean | { confirmed: boolean; checked: boolean }> {
    triggerEl = document.activeElement as HTMLElement
    checked.value = options.checkbox?.defaultChecked ?? false
    return new Promise((resolve) => {
      pending.value = {
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Delete',
        checkbox: options.checkbox ?? null,
        resolve,
      }
    })
  }

  function respond(value: boolean) {
    if (pending.value?.checkbox) {
      pending.value.resolve({ confirmed: value, checked: checked.value })
    } else {
      pending.value?.resolve(value)
    }
    pending.value = null
    triggerEl?.focus()
    triggerEl = null
  }

  return { confirm, respond, pending, checked }
}
