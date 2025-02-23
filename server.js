const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 🔹 CORS configurado correctamente
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
let agents = [
  { id: 1, name: "Carlos Pérez", statusId: 1, waitTime: 5 },
  { id: 2, name: "María López", statusId: 2, waitTime: 12 },
  { id: 3, name: "José Ramírez", statusId: 3, waitTime: 20 },
  { id: 4, name: "Laura Méndez", statusId: 4, waitTime: 0 },
];

let customers = [
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
    name: "Adnres Roberto",
    waitTime: 8,
    statusId: 2,
    statusName: "En espera",
  },
  {
    id: 5,
    name: "Julio Alfonso",
    waitTime: 10,
    statusId: 1,
    statusName: "En espera",
  },
  {
    id: 6,
    name: "Louis Dev",
    waitTime: 12,
    statusId: 1,
    statusName: "En espera",
  },
  {
    id: 7,
    name: "Test Julian",
    waitTime: 20,
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

// 🔹 Rutas REST API
app.get("/api/agents", (req, res) => res.json(agents));
app.get("/api/customers", (req, res) => res.json(customers));
app.get("/api/agent-statuses", (req, res) => res.json(agentStatuses));
app.get("/api/customer-statuses", (req, res) => res.json(customerStatuses));

// 🔹 Función para enviar datos a todos los clientes conectados
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error("Error enviando WebSocket:", error);
      }
    }
  });
}

app.put("/api/agents/:id", (req, res) => {
  const { id } = req.params;
  const { statusId, waitTime } = req.body;
  const agentIndex = agents.findIndex((agent) => agent.id === Number(id));
  console.log(req.params, req.body);
  if (agentIndex === -1) {
    return res.status(404).json({ error: "Agent not found" });
  }

  if (typeof statusId !== "number" || typeof waitTime !== "number") {
    return res.status(400).json({ error: "Invalid data format" });
  }

  agents[agentIndex] = { ...agents[agentIndex], statusId, waitTime };
  broadcast({ type: "UPDATE_AGENT", agent: agents[agentIndex] });
  res.json({ message: "Agent updated", agent: agents[agentIndex] });
});

app.put("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  const { statusId, waitTime } = req.body;
  const customerIndex = customers.findIndex(
    (customer) => customer.id === Number(id)
  );

  if (customerIndex === -1) {
    return res.status(404).json({ error: "Customer not found" });
  }

  if (typeof statusId !== "number" || typeof waitTime !== "number") {
    return res.status(400).json({ error: "Invalid data format" });
  }

  customers[customerIndex] = {
    ...customers[customerIndex],
    statusId,
    waitTime,
  };
  broadcast({ type: "UPDATE_CUSTOMER", customer: customers[customerIndex] });
  res.json({ message: "Customer updated", customer: customers[customerIndex] });
});

// Actualizar un agente o un client
app.patch("/api/update-status", (req, res) => {
  console.log("req.body", req.body);
  const { customerId, agentId, customerStatus, agentStatus } = req.body;

  // Buscar el agente y el cliente en los arrays
  const agentIndex = agents.findIndex((agent) => agent.id === agentId);
  const customerIndex = customers.findIndex(
    (customer) => customer.id === customerId
  );

  if (agentIndex === -1 || customerIndex === -1) {
    return res.status(404).json({ error: "Agente o cliente no encontrado" });
  }

  // Validar los estados
  const validAgentStatus = agentStatuses.find(
    (status) => status.name === agentStatus
  );
  const validCustomerStatus = customerStatuses.find(
    (status) => status.name === customerStatus
  );

  if (!validAgentStatus || !validCustomerStatus) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  // Actualizar estados en la data
  agents[agentIndex].statusId = validAgentStatus.id;
  customers[customerIndex].statusId = validCustomerStatus.id;
  customers[customerIndex].statusName = customerStatus;
  customers[customerIndex].waitTime = 0;

  // Enviar actualización en tiempo real con WebSocket
  broadcast({ type: "UPDATE_AGENT", agent: agents[agentIndex] });
  broadcast({ type: "UPDATE_CUSTOMER", customer: customers[customerIndex] });

  res.json({ message: "Estados actualizados correctamente" });
});

// 🔹 Manejo de conexiones WebSocket
wss.on("connection", (ws) => {
  console.log("Cliente conectado al WebSocket");

  // Enviar datos iniciales al cliente conectado
  ws.send(JSON.stringify({ type: "INIT", agents, customers }));

  // Manejo de desconexión
  ws.on("close", () => console.log("Cliente desconectado"));
});

// 🔹 Iniciar el servidor
server.listen(4000, () => console.log("✅ Server running on port 4000"));
