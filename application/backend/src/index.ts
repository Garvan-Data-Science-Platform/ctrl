import cors from "cors";
import express from "express";

import { backendPort, Workspace } from "common";

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));

app.get("/workspaces", (_, response) => {
  const workspaces: Workspace[] = [
    { name: "backend", version: "1.0.0" },
    { name: "common", version: "1.0.0" },
    { name: "frontend", version: "1.0.0" },
  ];
  response.json({ data: workspaces });
});

app.listen(backendPort, () => console.log(`Listening on http://localhost:${backendPort}`));
