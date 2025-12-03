export type ErrorComponentProps = {
  title?: string
  message: string
  details?: string[]
  status?: number
}

export function ErrorComponent({ title = 'Error', message, details, status }: ErrorComponentProps): string {
  const statusLabel = typeof status === 'number' ? `Error ${status}` : ''
  const hasDetails = Array.isArray(details) && details.length > 0

  return `
  <div class="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
    <div class="flex items-start gap-3">
      <div aria-hidden="true" class="mt-0.5 text-red-500">⚠️</div>
      <div class="flex-1">
        <div class="font-semibold">${title}</div>
        ${statusLabel ? `<div class="text-sm text-red-600">${statusLabel}</div>` : ''}
        <div class="mt-1">${message}</div>
        ${hasDetails ? `<ul class="mt-2 list-disc pl-5">${details!.map((d) => `<li>${d}</li>`).join('')}</ul>` : ''}
      </div>
    </div>
  </div>
  `
}
