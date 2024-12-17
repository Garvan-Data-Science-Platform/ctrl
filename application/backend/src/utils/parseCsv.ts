import { Readable } from 'stream'
import { parse } from 'fast-csv'

export async function parseCSV(stream: Readable): Promise<Record<string, string>[]> {
  const res: Record<string, string>[] = []

  return new Promise((resolve, reject) => {
    stream
      .pipe(parse({ headers: true }))
      .on('data', (data) => {
        res.push(data)
      })
      .on('error', (error) => reject(error))
      .on('end', () => resolve(res))
  })
}
