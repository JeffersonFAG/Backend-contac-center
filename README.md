#  Contact Center API

##  Descripción
Esta API proporciona información sobre los agentes y los clientes en espera en un centro de contacto (contact center).
Fue desarrollada en **Node.js con Express** y utiliza **WebSockets** para actualización en tiempo real.

##  Tecnologías Utilizadas
- **Node.js**
- **Express.js**
- **WebSockets** (ws)
- **CORS**

##  Estructura del Proyecto
```
📂 contact-center-api
├── 📄 server.js  # Archivo principal con la API y WebSockets
├── 📂 node_modules  # Dependencias del proyecto
├── 📄 package.json  # Configuración del proyecto y dependencias
└── 📄 README.md  # Documentación del proyecto
```

## Instalación
Para ejecutar este proyecto localmente:
```bash
# Clonar el repositorio
git clone https://github.com/JeffersonFAG/Backend-contac-center.git

# Acceder al directorio del proyecto
cd contact-center-api

# Instalar dependencias
npm install
```

## Uso
### Iniciar el servidor
```bash
node server.js
```
El servidor correrá en **http://localhost:4000**.

## Endpoints de la API REST
### Obtener agentes
```bash
GET /api/agents
```
**Respuesta:**
```json
[
  { "id": 1, "name": "Carlos Pérez", "statusId": 1, "waitTime": 5 },
  { "id": 2, "name": "María López", "statusId": 2, "waitTime": 12 }
]
```

### Obtener clientes en espera
```bash
GET /api/customers
```
**Respuesta:**
```json
[
  { "id": 1, "name": "Ana Martínez", "waitTime": 2, "statusId": 1, "statusName": "En espera" }
]
```

### Actualizar el estado de un agente
```bash
PUT /api/agents/:id
```
**Body:**
```json
{
  "statusId": 2,
  "waitTime": 10
}
```
**Respuesta:**
```json
{
  "message": "Agent updated",
  "agent": { "id": 1, "statusId": 2, "waitTime": 10 }
}
```

### Actualizar el estado de un cliente
```bash
PUT /api/customers/:id
```
**Body:**
```json
{
  "statusId": 2,
  "waitTime": 0
}
```

### Asignar un cliente a un agente
```bash
PATCH /api/update-status
```
**Body:**
```json
{
  "customerId": 1,
  "agentId": 2,
  "customerStatus": "Siendo atendido",
  "agentStatus": "En llamada"
}
```

## WebSockets
Cada vez que se actualiza un agente o un cliente, la API emite un evento **WebSocket** con los nuevos datos.

### Conexión WebSocket
```javascript
const ws = new WebSocket("ws://localhost:4000");
ws.onmessage = (event) => {
  console.log("Mensaje recibido:", JSON.parse(event.data));
};
```
**Eventos emitidos:**
- `UPDATE_AGENT`: Se envía cuando un agente cambia de estado.
- `UPDATE_CUSTOMER`: Se envía cuando un cliente cambia de estado.

## Configuraciones y Seguridad
- **CORS** habilitado para todas las conexiones.
- **Content Security Policy (CSP)** configurado para permitir conexiones WebSocket.

