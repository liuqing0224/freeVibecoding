export const creationInterviewStorageKey = 'workspace-creation-interview'
export const creationInterviewDraftStorageKey = `${creationInterviewStorageKey}-draft`

export function clearCreationInterviewDraft() {
  localStorage.removeItem(creationInterviewStorageKey)
  localStorage.removeItem(creationInterviewDraftStorageKey)
}
