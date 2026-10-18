import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
  RefreshCw,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Palette,
  Eye,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react';
import { MindMapNode } from '../types';

interface MindMapViewerProps {
  initialData: MindMapNode;
  onUpdateData?: (updated: MindMapNode) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

// Layout coordinate calculation for hierarchical mind map
interface LayoutNode {
  node: MindMapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  depth: number;
  children: LayoutNode[];
  isCollapsed: boolean;
}

const COLOR_THEMES = {
  modern: {
    name: 'Executive Slate',
    branches: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
  },
  neon: {
    name: 'Cyber Neon',
    branches: ['#38bdf8', '#4ade80', '#fbbf24', '#a855f7', '#f43f5e', '#22d3ee'],
  },
  emerald: {
    name: 'Emerald Garden',
    branches: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#14b8a6', '#0d9488'],
  },
  sunset: {
    name: 'Sunset Glow',
    branches: ['#f97316', '#fb923c', '#f43f5e', '#e11d48', '#d946ef', '#c026d3'],
  },
};

export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  initialData,
  onUpdateData,
  onRegenerate,
  isRegenerating,
}) => {
  const [data, setData] = useState<MindMapNode>(initialData);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof COLOR_THEMES>('modern');
  const [canvasMode, setCanvasMode] = useState<'dark' | 'light'>('dark');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Node editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Export notification
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasAutoFittedRef = useRef(false);

  // Sync state if initialData changes externally
  useEffect(() => {
    setData(initialData);
    hasAutoFittedRef.current = false;
  }, [initialData]);

  // Notify parent of updates
  const updateDataAndNotify = (newData: MindMapNode) => {
    setData(newData);
    if (onUpdateData) {
      onUpdateData(newData);
    }
  };

  // Expand / Collapse all
  const handleToggleExpandAll = (expand: boolean) => {
    const setAll = (node: MindMapNode): MindMapNode => ({
      ...node,
      isCollapsed: !expand,
      children: node.children ? node.children.map(setAll) : undefined,
    });
    updateDataAndNotify(setAll(data));
  };

  // Toggle Collapse on a single Node
  const toggleCollapse = (nodeId: string) => {
    const toggleInTree = (curr: MindMapNode): MindMapNode => {
      if (curr.id === nodeId) {
        return { ...curr, isCollapsed: !curr.isCollapsed };
      }
      if (curr.children) {
        return {
          ...curr,
          children: curr.children.map(toggleInTree),
        };
      }
      return curr;
    };
    updateDataAndNotify(toggleInTree(data));
  };

  // Edit Node Label
  const startEditing = (node: MindMapNode) => {
    setEditingNodeId(node.id);
    setEditLabel(node.label);
  };

  const saveEdit = () => {
    if (!editingNodeId || !editLabel.trim()) {
      setEditingNodeId(null);
      return;
    }
    const updateLabel = (curr: MindMapNode): MindMapNode => {
      if (curr.id === editingNodeId) {
        return { ...curr, label: editLabel.trim() };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(updateLabel) };
      }
      return curr;
    };
    updateDataAndNotify(updateLabel(data));
    setEditingNodeId(null);
  };

  // Add child node
  const addChildNode = (parentId: string) => {
    const newChild: MindMapNode = {
      id: 'node_' + Date.now(),
      label: 'New Concept',
      details: 'Supporting detail',
      children: [],
    };

    const addInTree = (curr: MindMapNode): MindMapNode => {
      if (curr.id === parentId) {
        return {
          ...curr,
          isCollapsed: false,
          children: [...(curr.children || []), newChild],
        };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(addInTree) };
      }
      return curr;
    };

    updateDataAndNotify(addInTree(data));
    setSelectedNodeId(newChild.id);
    startEditing(newChild);
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    if (nodeId === data.id) {
      alert('The root central topic cannot be deleted.');
      return;
    }

    const removeInTree = (curr: MindMapNode): MindMapNode => {
      if (!curr.children) return curr;
      return {
        ...curr,
        children: curr.children
          .filter((c) => c.id !== nodeId)
          .map(removeInTree),
      };
    };

    updateDataAndNotify(removeInTree(data));
    setSelectedNodeId(null);
  };

  // Non-passive wheel event listener to strictly prevent browser page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((prev) => Math.min(Math.max(0.25, prev * zoomFactor), 2.5));
    };
    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

// Calculate node dimensions so text wraps cleanly without truncation
function calculateNodeDimensions(label: string, depth: number): { width: number; height: number } {
  const text = (label || '').trim();
  const len = text.length;

  if (depth === 0) {
    const maxChars = 24;
    const lines = Math.max(1, Math.ceil(len / maxChars));
    const width = Math.max(200, Math.min(360, len * 9 + 54));
    const height = Math.max(52, 26 + lines * 22);
    return { width, height };
  } else if (depth === 1) {
    const maxChars = 22;
    const lines = Math.max(1, Math.ceil(len / maxChars));
    const width = Math.max(170, Math.min(310, len * 8.2 + 48));
    const height = Math.max(46, 22 + lines * 20);
    return { width, height };
  } else if (depth === 2) {
    const maxChars = 20;
    const lines = Math.max(1, Math.ceil(len / maxChars));
    const width = Math.max(150, Math.min(280, len * 7.5 + 42));
    const height = Math.max(40, 20 + lines * 18);
    return { width, height };
  } else {
    const maxChars = 18;
    const lines = Math.max(1, Math.ceil(len / maxChars));
    const width = Math.max(130, Math.min(250, len * 7 + 36));
    const height = Math.max(36, 18 + lines * 16);
    return { width, height };
  }
}

  // Layout Engine: Computes a clean, collision-free radiating two-sided tidy tree
  const activeBranchColors = COLOR_THEMES[selectedTheme].branches;

  const layout = useMemo(() => {
    const HORIZONTAL_GAP = 95;
    const VERTICAL_GAP = 22;

    const rootLabel = data?.label || 'Central Topic';
    const rootDims = calculateNodeDimensions(rootLabel, 0);

    const rootNode: LayoutNode = {
      node: data || { id: 'root', label: 'Central Topic' },
      x: 0,
      y: 0,
      width: rootDims.width,
      height: rootDims.height,
      color: '#0f172a',
      depth: 0,
      children: [],
      isCollapsed: false,
    };

    // Recursive helper to measure and build the LayoutNode tree
    const buildLayoutTree = (
      node: MindMapNode,
      depth: number,
      branchColor: string
    ): LayoutNode & { subtreeHeight: number } => {
      const dims = calculateNodeDimensions(node.label || 'Concept', depth);
      const isCollapsed = !!node.isCollapsed;

      let childrenLayout: (LayoutNode & { subtreeHeight: number })[] = [];
      let subtreeHeight = dims.height + VERTICAL_GAP;

      if (!isCollapsed && Array.isArray(node.children) && node.children.length > 0) {
        childrenLayout = node.children.map((child) =>
          buildLayoutTree(child, depth + 1, branchColor)
        );
        const childrenSum = childrenLayout.reduce((acc, c) => acc + c.subtreeHeight, 0);
        subtreeHeight = Math.max(dims.height + VERTICAL_GAP, childrenSum);
      }

      return {
        node,
        x: 0,
        y: 0,
        width: dims.width,
        height: dims.height,
        color: branchColor,
        depth,
        children: childrenLayout,
        isCollapsed,
        subtreeHeight,
      };
    };

    // Recursive helper to position nodes based on subtree heights and dimensions
    const positionSubtree = (
      item: LayoutNode & { subtreeHeight: number },
      parentX: number,
      parentWidth: number,
      startY: number,
      direction: 1 | -1
    ) => {
      item.x = parentX + direction * (parentWidth / 2 + HORIZONTAL_GAP + item.width / 2);

      if (item.isCollapsed || !item.children || item.children.length === 0) {
        item.y = startY + item.subtreeHeight / 2;
      } else {
        let currentChildY = startY;
        item.children.forEach((child) => {
          positionSubtree(
            child as LayoutNode & { subtreeHeight: number },
            item.x,
            item.width,
            currentChildY,
            direction
          );
          currentChildY += (child as LayoutNode & { subtreeHeight: number }).subtreeHeight;
        });

        const firstChild = item.children[0];
        const lastChild = item.children[item.children.length - 1];
        item.y = (firstChild.y + lastChild.y) / 2;
      }
    };

    const branches = Array.isArray(data?.children) ? data.children : [];
    const rightBranches: MindMapNode[] = [];
    const leftBranches: MindMapNode[] = [];

    branches.forEach((b, idx) => {
      if (idx % 2 === 0) {
        rightBranches.push(b);
      } else {
        leftBranches.push(b);
      }
    });

    const layoutSide = (
      branchList: MindMapNode[],
      direction: 1 | -1,
      baseColorIdx: number
    ): LayoutNode[] => {
      const builtTrees = branchList.map((branch, bIdx) => {
        const color = branch.color || activeBranchColors[(baseColorIdx + bIdx) % activeBranchColors.length];
        return buildLayoutTree(branch, 1, color);
      });

      const totalHeight = builtTrees.reduce((acc, t) => acc + t.subtreeHeight, 0);
      let currentY = -totalHeight / 2;

      builtTrees.forEach((tree) => {
        positionSubtree(tree, 0, rootNode.width, currentY, direction);
        currentY += tree.subtreeHeight;
      });

      return builtTrees;
    };

    const rightLayoutNodes = layoutSide(rightBranches, 1, 0);
    const leftLayoutNodes = layoutSide(leftBranches, -1, rightBranches.length);

    rootNode.children = [...rightLayoutNodes, ...leftLayoutNodes];
    return rootNode;
  }, [data, activeBranchColors]);

  // Flatten elements for render & compute bounding box
  const { connections, nodeItems, bounds } = useMemo(() => {
    const conns: React.ReactNode[] = [];
    const items: LayoutNode[] = [];
    let minX = -100;
    let maxX = 100;
    let minY = -50;
    let maxY = 50;

    const traverse = (parent: LayoutNode) => {
      items.push(parent);
      minX = Math.min(minX, parent.x - parent.width / 2);
      maxX = Math.max(maxX, parent.x + parent.width / 2);
      minY = Math.min(minY, parent.y - parent.height / 2);
      maxY = Math.max(maxY, parent.y + parent.height / 2);

      if (!parent.isCollapsed && parent.children) {
        parent.children.forEach((child) => {
          const fromX =
            parent.depth === 0
              ? child.x > 0
                ? parent.width / 2
                : -parent.width / 2
              : child.x > parent.x
              ? parent.x + parent.width / 2
              : parent.x - parent.width / 2;
          const toX = child.x > parent.x ? child.x - child.width / 2 : child.x + child.width / 2;

          const midX = (fromX + toX) / 2;
          const d = `M ${fromX} ${parent.y} C ${midX} ${parent.y}, ${midX} ${child.y}, ${toX} ${child.y}`;

          conns.push(
            <path
              key={`${fromX},${parent.y}-${toX},${child.y}`}
              d={d}
              fill="none"
              stroke={child.color}
              strokeWidth={parent.depth === 0 ? 2.8 : 2.0}
              strokeOpacity={0.8}
              className="transition-all duration-300"
            />
          );
          traverse(child);
        });
      }
    };

    traverse(layout);
    return { connections: conns, nodeItems: items, bounds: { minX, maxX, minY, maxY } };
  }, [layout]);

  // Auto-fit function: Guarantees full map is visible and comfortably readable
  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    const width = container?.clientWidth || 960;
    const height = container?.clientHeight || 580;

    const totalWidth = bounds.maxX - bounds.minX + 160;
    const totalHeight = bounds.maxY - bounds.minY + 130;

    const scaleX = (width - 40) / totalWidth;
    const scaleY = (height - 40) / totalHeight;

    // Sensible auto-fit clamp: scales down to 0.35 for large hierarchies so all branches stay visible without clipping
    const targetZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.05);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const targetPanX = width / 2 - centerX * targetZoom;
    const targetPanY = height / 2 - centerY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, [bounds]);

  // Reset View to 100% zoom centered
  const handleResetView = () => {
    const container = containerRef.current;
    const width = container?.clientWidth || 960;
    const height = container?.clientHeight || 580;
    setZoom(1.0);
    setPan({ x: width / 2, y: height / 2 });
  };

  // Initial and Resize Auto-fit
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen();
      hasAutoFittedRef.current = true;
    }, 60);

    const container = containerRef.current;
    if (!container) return () => clearTimeout(timer);

    const observer = new ResizeObserver(() => {
      if (!hasAutoFittedRef.current) {
        fitToScreen();
      }
    });
    observer.observe(container);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [fitToScreen]);

  // Auto-refit when toggling fullscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen();
    }, 120);
    return () => clearTimeout(timer);
  }, [isFullscreen, fitToScreen]);

  // Center on Root Node
  const handleCenterRoot = () => {
    const container = containerRef.current;
    const width = container?.clientWidth || 960;
    const height = container?.clientHeight || 560;
    setZoom(0.9);
    setPan({ x: width / 2, y: height / 2 });
  };

  // Export to PNG with solid backdrop
  const handleExportPng = () => {
    if (!containerRef.current) return;

    try {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!svg) return;

      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas background based on selected mode
      ctx.fillStyle = canvasMode === 'dark' ? '#0b1120' : '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title header on export
      ctx.fillStyle = canvasMode === 'dark' ? '#38bdf8' : '#0284c7';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`SmartSpeak Knowledge Graph: ${data.label}`, 60, 70);

      // Render nodes and links directly to canvas
      const scale = Math.min(2200 / (bounds.maxX - bounds.minX + 200), 1200 / (bounds.maxY - bounds.minY + 200));
      const offX = 1200 - ((bounds.minX + bounds.maxX) / 2) * scale;
      const offY = 740 - ((bounds.minY + bounds.maxY) / 2) * scale;

      // Draw connections
      nodeItems.forEach((item) => {
        if (!item.isCollapsed && item.children) {
          item.children.forEach((child) => {
            const startX = offX + item.x * scale;
            const startY = offY + item.y * scale;
            const endX = offX + child.x * scale;
            const endY = offY + child.y * scale;
            const midX = (startX + endX) / 2;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
            ctx.strokeStyle = child.color;
            ctx.lineWidth = 3.5 * scale;
            ctx.stroke();
          });
        }
      });

      // Helper for wrapping text in canvas
      const drawWrappedCanvasText = (
        text: string,
        cx: number,
        cy: number,
        maxWidth: number,
        lineHeight: number
      ) => {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let currentLine = '';

        for (const w of words) {
          const test = currentLine ? `${currentLine} ${w}` : w;
          if (ctx.measureText(test).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = w;
          } else {
            currentLine = test;
          }
        }
        if (currentLine) lines.push(currentLine);

        const startY = cy - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((l, idx) => {
          ctx.fillText(l, cx, startY + idx * lineHeight);
        });
      };

      // Draw node boxes
      nodeItems.forEach((item) => {
        const nx = offX + (item.x - item.width / 2) * scale;
        const ny = offY + (item.y - item.height / 2) * scale;
        const nw = item.width * scale;
        const nh = item.height * scale;

        ctx.fillStyle = canvasMode === 'dark' 
          ? (item.depth === 0 ? '#1e293b' : '#0f172a')
          : (item.depth === 0 ? '#ffffff' : '#ffffff');
        ctx.strokeStyle = item.depth === 0 ? '#0284c7' : item.color;
        ctx.lineWidth = (item.depth === 0 ? 3 : 2) * scale;

        // Rounded rect
        ctx.beginPath();
        ctx.roundRect(nx, ny, nw, nh, 8 * scale);
        ctx.fill();
        ctx.stroke();

        // Complete wrapped text
        ctx.fillStyle = canvasMode === 'dark' ? '#ffffff' : '#0f172a';
        ctx.font = `${item.depth === 0 ? 'bold 15px' : '13px'} sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawWrappedCanvasText(item.node.label, nx + nw / 2, ny + nh / 2, nw - 20 * scale, 18 * scale);
      });

      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `SmartSpeak_MindMap_${data.label.replace(/\s+/g, '_')}.png`;
      downloadLink.href = png;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setExportSuccess('Mind Map exported as high-resolution PNG image');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('PNG Export failed', err);
    }
  };

  // Export to Markdown outline
  const handleExportOutline = () => {
    const buildMarkdown = (node: MindMapNode, depth = 0): string => {
      const indent = '  '.repeat(depth);
      let str = `${indent}- **${node.label}**`;
      if (node.details) str += `: ${node.details}`;
      str += '\n';
      if (node.children) {
        node.children.forEach((c) => {
          str += buildMarkdown(c, depth + 1);
        });
      }
      return str;
    };

    const md = `# Mind Map: ${data.label}\n\n${buildMarkdown(data)}`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartSpeak_MindMap_Outline.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess('Mind Map outline downloaded as Markdown');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  // Matched search nodes count
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase();
    return nodeItems.filter(
      (n) => n.node.label.toLowerCase().includes(q) || (n.node.details && n.node.details.toLowerCase().includes(q))
    ).length;
  }, [nodeItems, searchQuery]);

  return (
    <div
      className={`space-y-4 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col justify-between' : ''
      }`}
    >
      {/* Mind Map Controls & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Interactive Mind Map Canvas</span>
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] font-mono text-slate-500">
            {nodeItems.length} nodes fully rendered
          </span>

          {/* Quick Search */}
          <div className="relative ml-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-36 sm:w-48 placeholder:text-slate-400"
            />
            {searchQuery && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-sky-600 font-bold">
                {matchCount} match{matchCount === 1 ? '' : 'es'}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Regenerate mind map using Gemini"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}

          {/* Expand / Collapse All */}
          <button
            onClick={() => handleToggleExpandAll(true)}
            className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            title="Expand all nodes"
          >
            Expand All
          </button>
          <button
            onClick={() => handleToggleExpandAll(false)}
            className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            title="Collapse branches to main topics"
          >
            Collapse All
          </button>

          {/* Fit & Center Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={fitToScreen}
              className="px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 rounded flex items-center gap-1"
              title="Fit entire mind map into view"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Fit All</span>
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Reset View (100% Zoom, Centered)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCenterRoot}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Center on Root Node"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Mode Toggle (Dark Studio vs Light Educational) */}
          <button
            onClick={() => setCanvasMode((m) => (m === 'dark' ? 'light' : 'dark'))}
            className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
            title={canvasMode === 'dark' ? 'Switch to Light Educational Canvas' : 'Switch to Dark Studio Canvas'}
          >
            {canvasMode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>

          {/* Theme Selector */}
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value as any)}
            className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
            title="Select visual palette theme"
          >
            <option value="modern">Slate Theme</option>
            <option value="neon">Neon Cyber</option>
            <option value="emerald">Emerald Theme</option>
            <option value="sunset">Sunset Theme</option>
          </select>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mind Map'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPng}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            title="Export Mind Map as PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>

          <button
            onClick={handleExportOutline}
            className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1"
            title="Export as Markdown Outline"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.md</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Main Interactive Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full ${
          isFullscreen ? 'flex-1 h-full min-h-[500px]' : 'h-[560px] sm:h-[640px]'
        } ${canvasMode === 'dark' ? 'bg-[#0b1120] border-slate-800' : 'bg-[#f8fafc] border-slate-200'} rounded-2xl border shadow-xl overflow-hidden cursor-grab active:cursor-grabbing select-none`}
      >
        {/* Subtle grid backdrop */}
        <div
          className={`absolute inset-0 pointer-events-none opacity-40 ${
            canvasMode === 'dark'
              ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px]'
              : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px]'
          }`}
        />

        {/* Ambient glow in center */}
        {canvasMode === 'dark' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
        )}

        {/* SVG Connection Lines Layer */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <g>{connections}</g>
        </svg>

        {/* Interactive HTML Node Elements Layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {nodeItems.map((item) => {
            const isRoot = item.depth === 0;
            const hasChildren = item.node.children && item.node.children.length > 0;
            const isEditing = editingNodeId === item.node.id;
            const isSelected = selectedNodeId === item.node.id;

            // Search highlight
            const isMatch =
              searchQuery.trim() !== '' &&
              (item.node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.node.details && item.node.details.toLowerCase().includes(searchQuery.toLowerCase())));

            return (
              <div
                key={item.node.id}
                style={{
                  left: item.x - item.width / 2,
                  top: item.y - item.height / 2,
                  width: item.width,
                  minHeight: item.height,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(item.node.id);
                }}
                className={`absolute pointer-events-auto rounded-xl flex items-center justify-between px-3.5 py-2 text-xs font-semibold shadow-lg transition-all duration-200 group ${
                  isRoot
                    ? (canvasMode === 'dark'
                        ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-2 border-sky-400 shadow-sky-500/20'
                        : 'bg-white text-slate-900 border-2 border-sky-600 shadow-md shadow-sky-600/10')
                    : (canvasMode === 'dark'
                        ? 'bg-slate-900/95 text-slate-100 border border-slate-700/80 hover:border-slate-500 shadow-md'
                        : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300 shadow-sm')
                } ${isSelected ? 'ring-2 ring-sky-400 ring-offset-2 ' + (canvasMode === 'dark' ? 'ring-offset-slate-950' : 'ring-offset-white') : ''} ${
                  isMatch ? 'ring-2 ring-amber-400 ring-offset-2 ' + (canvasMode === 'dark' ? 'ring-offset-slate-950' : 'ring-offset-white') + ' scale-105' : ''
                }`}
              >
                {/* Branch Color Pip */}
                {!isRoot && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 mr-2 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                {/* Node Label / Inline Editor */}
                {isEditing ? (
                  <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editLabel}
                      autoFocus
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingNodeId(null);
                      }}
                      className={`w-full text-xs px-2 py-1 rounded border border-sky-400 focus:outline-none ${
                        canvasMode === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                      }`}
                    />
                    <button onClick={saveEdit} className="p-0.5 hover:bg-slate-700 text-emerald-400 rounded">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingNodeId(null)}
                      className="p-0.5 hover:bg-slate-700 text-rose-400 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDoubleClick={() => startEditing(item.node)}
                    className="flex-1 cursor-pointer select-none text-left break-words whitespace-normal leading-snug py-0.5"
                    title={item.node.details ? `${item.node.label}: ${item.node.details}` : item.node.label}
                  >
                    {item.node.label}
                  </div>
                )}

                {/* Action Buttons on Hover */}
                <div className="flex items-center gap-0.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(item.node);
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                      title="Edit label"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addChildNode(item.node.id);
                    }}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-300 rounded transition-colors"
                    title="Add subtopic"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  {!isRoot && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(item.node.id);
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
                      title="Delete node"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Collapse / Expand Toggle Badge */}
                {hasChildren && !isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollapse(item.node.id);
                    }}
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                      item.isCollapsed
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={item.isCollapsed ? 'Expand branches' : 'Collapse branches'}
                  >
                    {item.isCollapsed ? `+${item.node.children?.length}` : '−'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Viewport Floating Info Indicator */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 font-mono shadow-lg flex items-center gap-3">
          <button
            onClick={fitToScreen}
            className="hover:text-sky-400 transition-colors flex items-center gap-1"
            title="Click to re-fit view"
          >
            <Maximize2 className="w-3 h-3 text-sky-400" />
            <span>Auto-Fit: 100% Visible</span>
          </button>
          <span className="text-slate-600">·</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNodeId && (
          <div className="absolute top-4 left-4 max-w-xs bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-2xl text-xs text-slate-300 z-10">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5">
              <span className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">
                Node Properties
              </span>
              <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {(() => {
              const findNode = (curr: MindMapNode): MindMapNode | null => {
                if (curr.id === selectedNodeId) return curr;
                if (curr.children) {
                  for (const child of curr.children) {
                    const found = findNode(child);
                    if (found) return found;
                  }
                }
                return null;
              };
              const node = findNode(data);
              if (!node) return null;

              return (
                <div className="space-y-2">
                  <p className="font-semibold text-sky-400 text-sm">{node.label}</p>
                  {node.details && (
                    <p className="text-slate-400 text-[11px] leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                      {node.details}
                    </p>
                  )}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => startEditing(node)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Label
                    </button>
                    <button
                      onClick={() => addChildNode(node.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Child
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
