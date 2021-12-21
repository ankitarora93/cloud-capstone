/**
 * Fields in a request to update a single Entry item.
 */
export interface UpdateEntryRequest {
  name: string
  dueDate: string
  done: boolean
}