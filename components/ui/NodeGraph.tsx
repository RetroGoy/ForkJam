"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Node } from '@/lib/supabase';
import { NodeCard } from './NodeCard';

interface NodeGraphProps {
  nodes: Node[];
  onNodeSelect: (node: Node) => void;
  onAddChild: (parentNode: Node) => void;
}

type Position = {
  x: number;
  y: number;
};

type LayoutNode = {
  node: Node;
  position: Position;
  children: string[];
};

export function NodeGraph({ nodes, onNodeSelect, onAddChild }: NodeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layoutNodes, setLayoutNodes] = useState<Map<string, LayoutNode>>(new Map());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  
  // Initialize node positions
  useEffect(() => {
    if (!nodes.length) return;

    // Build tree structure
    const nodeMap = new Map<string, LayoutNode>();
    const childrenMap = new Map<string, string[]>();
    
    // First, create all nodes with default positions
    nodes.forEach((node) => {
      nodeMap.set(node.id, {
        node,
        position: { x: 0, y: 0 },
        children: [],
      });
      
      // Initialize children arrays
      if (!childrenMap.has(node.id)) {
        childrenMap.set(node.id, []);
      }
      
      // Add this node as a child of its parent
      if (node.parent_node_id) {
        const parentChildren = childrenMap.get(node.parent_node_id) || [];
        parentChildren.push(node.id);
        childrenMap.set(node.parent_node_id, parentChildren);
      }
    });
    
    // Update children lists in layout nodes
    childrenMap.forEach((children, nodeId) => {
      const layoutNode = nodeMap.get(nodeId);
      if (layoutNode) {
        layoutNode.children = children;
      }
    });
    
    // Find root nodes (those without parents)
    const rootNodes = nodes.filter(node => !node.parent_node_id);
    
    // Position nodes in a tree layout
    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 200;
    
    const positionNode = (nodeId: string, level: number, index: number, totalSiblings: number) => {
      const layoutNode = nodeMap.get(nodeId);
      if (!layoutNode) return;
      
      // Calculate x based on level
      const x = level * HORIZONTAL_SPACING;
      
      // Calculate y based on siblings
      const siblingSpacing = VERTICAL_SPACING;
      const totalHeight = (totalSiblings - 1) * siblingSpacing;
      const startY = -totalHeight / 2;
      const y = startY + index * siblingSpacing;
      
      layoutNode.position = { x, y };
      
      // Position children
      const children = layoutNode.children;
      children.forEach((childId, childIndex) => {
        positionNode(childId, level + 1, childIndex, children.length);
      });
    };
    
    // Position each root node and its descendants
    rootNodes.forEach((rootNode, index) => {
      positionNode(rootNode.id, 0, index, rootNodes.length);
    });
    
    setLayoutNodes(nodeMap);
  }, [nodes]);
  
  // Handle mouse interactions for panning and zooming
  const handleMouseDown = (event: React.MouseEvent) => {
    setDragging(true);
  };
  
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!dragging) return;
    
    setViewPosition(prev => ({
      x: prev.x + event.movementX,
      y: prev.y + event.movementY,
    }));
  };
  
  const handleMouseUp = () => {
    setDragging(false);
  };
  
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * scaleFactor, 0.3), 2));
  };
  
  const handleNodeClick = (node: Node) => {
    setSelectedNodeId(node.id);
    onNodeSelect(node);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-gray-900 relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      {/* Graph container with transform */}
      <div
        className="absolute"
        style={{
          transform: `translate(${viewPosition.x}px, ${viewPosition.y}px) scale(${scale})`,
          transformOrigin: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Center point marker */}
        <div className="absolute left-1/2 top-1/2 h-2 w-2 bg-yellow-500 rounded-full" />
        
        {/* Connections between nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {Array.from(layoutNodes.values()).map((layoutNode) => (
            layoutNode.children.map((childId) => {
              const childNode = layoutNodes.get(childId);
              if (!childNode) return null;
              
              const parentX = layoutNode.position.x + window.innerWidth / 2;
              const parentY = layoutNode.position.y + window.innerHeight / 2;
              const childX = childNode.position.x + window.innerWidth / 2;
              const childY = childNode.position.y + window.innerHeight / 2;
              
              return (
                <line
                  key={`${layoutNode.node.id}-${childId}`}
                  x1={parentX}
                  y1={parentY}
                  x2={childX}
                  y2={childY}
                  stroke="#9b782f"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              );
            })
          ))}
        </svg>
        
        {/* Nodes */}
        {Array.from(layoutNodes.values()).map((layoutNode) => (
          <div
            key={layoutNode.node.id}
            className="absolute p-2 w-64 transition-transform duration-300 cursor-pointer"
            style={{
              left: `calc(50% + ${layoutNode.position.x}px)`,
              top: `calc(50% + ${layoutNode.position.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => handleNodeClick(layoutNode.node)}
          >
            <NodeCard 
              node={layoutNode.node} 
              isSelected={selectedNodeId === layoutNode.node.id}
              onAddChild={() => onAddChild(layoutNode.node)}
              allNodes={nodes} />
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button 
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded"
          onClick={() => setScale(prev => Math.min(prev + 0.1, 2))}
        >
          +
        </button>
        <button 
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded"
          onClick={() => setScale(prev => Math.max(prev - 0.1, 0.3))}
        >
          -
        </button>
        <button 
          className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded"
          onClick={() => {
            setViewPosition({ x: 0, y: 0 });
            setScale(1);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}