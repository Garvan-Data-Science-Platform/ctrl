import cors from 'cors'
import express from 'express'

import { Workspace } from 'common'

const app = express()
const port = 5000

app.use(cors({ origin: 'http://localhost:3000' }))

app.get('/workspaces', (_, reponse) => {
  const workspaces: Workspace[] = [
    { name: 'backend', version: '1.0.0' },
    { name: 'common', version: '1.0.0' },
    { name: 'frontend', version: '1.0.0' },
  ]
  reponse.json({ data: workspaces })
})

app.listen(port, () => console.log(`Listening on http://localhost:${port}`))

export { app };
