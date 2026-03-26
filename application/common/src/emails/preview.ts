import participantInviteHtml from './participantInvite.html?raw'
import styles from './styles.css?raw'
import DOMPurify from 'dompurify'

export function previewParticipantInviteEmail(
  registerLink: string,
  title: string,
  explanatoryText: string,
): { html: string } {
  const html = participantInviteHtml
    .replaceAll('${title}', DOMPurify.sanitize(title))
    .replaceAll('${registerLink}', DOMPurify.sanitize(registerLink))
    .replaceAll('${explanatoryText}', DOMPurify.sanitize(explanatoryText))
    .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${styles}</style>`)
  return { html }
}
