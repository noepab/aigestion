import { Badge, Button, Card, Table } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';

const DOCKER_API_BASE = 'http://localhost:3000/api/docker';

interface DockerPort {
  IP?: string;
  PublicPort?: number;
  PrivatePort?: number;
  Type?: string;
}

interface DockerContainer {
  Id: string;
  Names?: string[];
  Image: string;
  Status: string;
  State: string;
  Ports?: DockerPort[];
}

async function fetchContainers(): Promise<DockerContainer[]> {
  const { data } = await axios.get(`${DOCKER_API_BASE}/containers`);
  return data;
}

export default function DockerPage() {
  const {
    data: containers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['docker', 'containers'],
    queryFn: fetchContainers,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <div>Loading containers...</div>;
  }

  if (error) {
    return <div>Error loading containers: {(error as Error).message}</div>;
  }

  const getStatusBadge = (status: string) => {
    const lower = status.toLowerCase();
    const color = lower.includes('up') ? 'green' : lower.includes('exited') ? 'red' : 'gray';
    return <Badge color={color}>{status}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Docker Containers</h1>
        <div className="space-x-2">
          <Button>Refresh</Button>
          <Button variant="primary">+ New Container</Button>
        </div>
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Image</th>
              <th>Status</th>
              <th>Ports</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {containers.map((container) => (
              <tr key={container.Id}>
                <td className="font-mono text-sm">{container.Id.substring(0, 12)}</td>
                <td>{(container.Names?.[0] ?? '(unnamed)').replace(/^\//, '')}</td>
                <td>{container.Image}</td>
                <td>{getStatusBadge(container.Status)}</td>
                <td>
                  {container.Ports?.length
                    ? container.Ports.map((port) => {
                        const ip = port.IP ?? '0.0.0.0';
                        const publicPort = port.PublicPort ?? port.PrivatePort ?? 0;
                        const privatePort = port.PrivatePort ?? publicPort;
                        const type = port.Type ?? 'tcp';
                        return (
                          <div key={`${ip}:${publicPort}`}>
                            {publicPort}:{privatePort}/{type}
                          </div>
                        );
                      })
                    : '-'}
                </td>
                <td className="space-x-2">
                  <Button size="sm" variant="outline">
                    Logs
                  </Button>
                  <Button size="sm" variant="outline">
                    {container.State === 'running' ? 'Stop' : 'Start'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </motion.div>
  );
}
