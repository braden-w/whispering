import { createServer } from "net"

/**
 * Find an available port starting from the given port number
 */
export async function findAvailablePort(startPort: number = 4096): Promise<number> {
  let port = startPort
  const maxPort = startPort + 100 // Try up to 100 ports
  
  while (port <= maxPort) {
    if (await isPortAvailable(port)) {
      return port
    }
    port++
  }
  
  throw new Error(`No available ports found in range ${startPort}-${maxPort}`)
}

/**
 * Check if a specific port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    
    server.listen(port, () => {
      server.close(() => {
        resolve(true)
      })
    })
    
    server.on('error', () => {
      resolve(false)
    })
  })
}