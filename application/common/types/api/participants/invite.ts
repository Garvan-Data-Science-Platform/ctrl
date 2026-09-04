// TODO: Is this needed given enum from schema.prisma?
export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  FAILED_TO_SEND = 'FAILED_TO_SEND',
}
