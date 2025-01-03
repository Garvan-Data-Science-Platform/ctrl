/**
 * @example {
 *  "subject": "Somethings Wrong!",
 *  "content": "There was some problem with this thing that I was doing.\nBut I don't know why?\n\nCheers,\nJohn Doe"
 * }
 */
export interface ContactUsRequest {
  subject: string
  content: string
}
