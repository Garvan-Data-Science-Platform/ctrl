import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Workspace } from "common";

// TODO: Clean this up
const backendPort = __API_PORT__;
const backendHost = __API_HOST__;

const backendBaseUrl = `http://${backendHost}:${backendPort}`;

const App = () => {
  const [data, setData] = useState<Workspace[]>([]);

  useEffect(() => {
    fetch(`${backendBaseUrl}/workspaces`)
      .then((response) => response.json())
      .then(({ data }) => setData(data));
  }, []);

  return (
    <StrictMode>
      <h1>Building a fullstack Typescript Project</h1>
      <h2>Workspaces</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </StrictMode>
  );
};

const app = document.querySelector("#app");
if (app) createRoot(app).render(<App />);
