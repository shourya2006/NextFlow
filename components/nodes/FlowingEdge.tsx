import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";
import { useRunStore } from "@/store/runStore";

export default function FlowingEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const runningNodeIds = useRunStore((s) => s.runningNodeIds);
  const isRunning = runningNodeIds.has(source) && runningNodeIds.has(target);
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  if (isRunning) {
    return (
      <>
        {/* Glowing base path */}
        <path
          d={edgePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2}
          strokeOpacity={0.35}
          style={{ filter: "blur(2px)" }}
        />
        {/* Solid animated path */}
        <path
          d={edgePath}
          fill="none"
          stroke="#818cf8"
          strokeWidth={2}
          strokeDasharray="10 8"
          strokeLinecap="round"
          style={{
            animation: "flow-dash 0.6s linear infinite",
          }}
        />
        {/* Bright moving dot */}
        <circle r={4} fill="#c7d2fe">
          <animateMotion
            dur="1.2s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>

        <style>{`
          @keyframes flow-dash {
            from { stroke-dashoffset: 18; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      </>
    );
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{ stroke: "#404040", strokeWidth: 1.5, ...style }}
    />
  );
}
