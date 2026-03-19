import participantInviteHtml from './participantInvite.html?raw'
import styles from './styles.css?raw'

export function previewParticipantInviteEmail(
  registerLink: string,
  title: string,
  explanatoryText: string,
): { html: string } {
  const html = participantInviteHtml
    .replaceAll('${title}', title)
    .replaceAll('${registerLink}', registerLink)
    .replaceAll('${explanatoryText}', explanatoryText)
    .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${styles}</style>`)
  return { html }
}
