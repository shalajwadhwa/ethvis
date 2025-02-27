import React from "react";
import EthereumTracker from "@/app/lib/EthereumTracker";

const NodeAttributes = ({
  hoveredNode,
  ethereumTracker,
}: {
  hoveredNode: string | null;
  ethereumTracker: EthereumTracker;
}) => {
  if (!hoveredNode) {
    return null;
  }

  const nodes = ethereumTracker.getNodes();
  const attributes = nodes.get(hoveredNode);

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        padding: "8px",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        borderRadius: "5px",
      }}
    >
      {attributes && (
        <ul>
          {Object.entries(attributes).map(([key, value]) => (
            <li key={key}>
              {key}: {key === 'isContract' ? value.toString() : key === 'netBalance' ? (Number(value) / 10**18).toString() : value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NodeAttributes;
