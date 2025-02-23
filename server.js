const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 🔹 Configuración de CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// 🔹 Configurar CSP para permitir WebSockets
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' ws://localhost:4000"
  );
  next();
});

// 🔹 Datos iniciales
const agents = [
  { id: 1, name: "Carlos Pérez", statusId: 1, waitTime: 5 },
  { id: 2, name: "María López", statusId: 2, waitTime: 12 },
  { id: 3, name: "José Ramírez", statusId: 3, waitTime: 20 },
  { id: 4, name: "Laura Méndez", statusId: 4, waitTime: 0 },
];

const customers = [
  {
    id: 1,
    name: "Ana Martínez",
    waitTime: 2,
    statusId: 1,
    statusName: "En espera",
  },
  {
    id: 2,
    name: "Pedro Gómez",
    waitTime: 4,
    statusId: 1,
    statusName: "En espera",
  },
  {
    id: 3,
    name: "Carla Rodríguez",
    waitTime: 6,
    statusId: 2,
    statusName: "En espera",
  },
  {
    id: 4,
    name: "Andrés Roberto",
    waitTime: 8,
    statusId: 2,
    statusName: "En espera",
  },
];

const agentStatuses = [
  { id: 1, name: "Disponible" },
  { id: 2, name: "En llamada" },
  { id: 3, name: "En pausa" },
  { id: 4, name: "Fuera de línea" },
];

const customerStatuses = [
  { id: 1, name: "En espera" },
  { id: 2, name: "Siendo atendido" },
  { id: 3, name: "Atendido" },
];

// 🔹 Función para enviar datos a todos los clientes conectados
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error("Error enviando WebSocket:", error);
      }
    }
  });
};

// 🔹 Rutas REST API
app.get("/api/agents", (req, res) => res.json(agents));
app.get("/api/customers", (req, res) => res.json(customers));
app.get("/api/agent-statuses", (req, res) => res.json(agentStatuses));
app.get("/api/customer-statuses", (req, res) => res.json(customerStatuses));

app.put("/api/agents/:id", (req, res) => {
  const { id } = req.params;
  const { statusId, waitTime } = req.body;
  const agent = agents.find((a) => a.id === Number(id));
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (typeof statusId !== "number" || typeof waitTime !== "number")
    return res.status(400).json({ error: "Invalid data format" });
  Object.assign(agent, { statusId, waitTime });
  broadcast({ type: "UPDATE_AGENT", agent });
  res.json({ message: "Agent updated", agent });
});

app.put("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  const { statusId, waitTime } = req.body;
  const customer = customers.find((c) => c.id === Number(id));
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  if (typeof statusId !== "number" || typeof waitTime !== "number")
    return res.status(400).json({ error: "Invalid data format" });
  Object.assign(customer, { statusId, waitTime });
  broadcast({ type: "UPDATE_CUSTOMER", customer });
  res.json({ message: "Customer updated", customer });
});

app.patch("/api/update-status", (req, res) => {
  const { customerId, agentId, customerStatus, agentStatus } = req.body;
  const agent = agents.find((a) => a.id === agentId);
  const customer = customers.find((c) => c.id === customerId);
  if (!agent || !customer)
    return res.status(404).json({ error: "Agente o cliente no encontrado" });
  const validAgentStatus = agentStatuses.find((s) => s.name === agentStatus);
  const validCustomerStatus = customerStatuses.find(
    (s) => s.name === customerStatus
  );
  if (!validAgentStatus || !validCustomerStatus)
    return res.status(400).json({ error: "Estado inválido" });
  Object.assign(agent, { statusId: validAgentStatus.id });
  Object.assign(customer, {
    statusId: validCustomerStatus.id,
    statusName: customerStatus,
    waitTime: 0,
  });
  broadcast({ type: "UPDATE_AGENT", agent });
  broadcast({ type: "UPDATE_CUSTOMER", customer });
  res.json({ message: "Estados actualizados correctamente" });
});

// 🔹 Manejo de conexiones WebSocket
wss.on("connection", (ws) => {
  console.log("Cliente conectado al WebSocket");
  ws.send(JSON.stringify({ type: "INIT", agents, customers }));
  ws.on("close", () => console.log("Cliente desconectado"));
});

// 🔹 Iniciar el servidor
const PORT = 4000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
