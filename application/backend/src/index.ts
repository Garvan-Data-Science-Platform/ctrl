import cors from 'cors'
import express from 'express'

import { Workspace } from 'common'

const app = express()

// TODO: Move into common module, perhaps
const backendPort = parseInt(process.env.BACKEND_PORT ?? 5000);
const backendHost = process.env.BACKEND_HOST ?? '127.0.0.1';

const frontendPort = parseInt(process.env.FRONTEND_PORT ?? 3000);
const frontendHost = process.env.FRONTEND_HOST ?? '127.0.0.1';

app.use(cors({
  origin: `http://${frontendHost}:${frontendPort}`
}));

app.get('/workspaces', (_, response) => {
  const workspaces: Workspace[] = [
    { name: 'backend', version: '1.0.0' },
    { name: 'common', version: '1.0.0' },
    { name: 'frontend', version: '1.0.0' },
  ]
  response.json({ data: workspaces })
})

app.listen(
  backendPort,
  () => console.log(`Listening on http://${backendHost}:${backendPort}`)
)

export { app };
