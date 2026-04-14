import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodePalette } from './NodePalette';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Download, Upload } from 'lucide-react';

const INITIAL_NODES: Node[] = [
  { id: 'input-1', type: 'input', data: { label: 'Input' }, position: { x: 250, y: 25 } },
  { id: 'llm-1', type: 'default', data: { label: 'LLM Call' }, position: { x: 250, y: 150 } },
  { id: 'output-1', type: 'output', data: { label: 'Output' }, position: { x: 250, y: 300 } },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e-input-llm', source: 'input-1', target: 'llm-1', animated: true },
  { id: 'e-llm-output', source: 'llm-1', target: 'output-1' },
];

export function CanvasEditorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [undoStack, setUndoStack] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-49), { nodes: [...nodes], edges: [...edges] }]);
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      setNodes(last.nodes);
      setEdges(last.edges);
      return prev.slice(0, -1);
    });
  }, [setNodes, setEdges]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent-flow.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleAddNode = useCallback(
    (type: string, label: string) => {
      pushUndo();
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: type === 'input' || type === 'output' ? type : 'default',
        data: { label },
        position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [pushUndo, setNodes],
  );

  return (
    <div className="flex h-full gap-4">
      {/* Node Palette */}
      <NodePalette onAddNode={handleAddNode} />

      {/* Canvas */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleUndo} disabled={undoStack.length === 0}>
            <Undo2 size={14} className="mr-1" /> Undo
          </Button>
          <Button size="sm" variant="outline" disabled>
            <Redo2 size={14} className="mr-1" /> Redo
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download size={14} className="mr-1" /> Export
          </Button>
          <Button size="sm" variant="outline">
            <Upload size={14} className="mr-1" /> Import
          </Button>
        </div>

        {/* React Flow Canvas */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]"
          data-testid="canvas-editor"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            minZoom={0.3}
            maxZoom={3}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
