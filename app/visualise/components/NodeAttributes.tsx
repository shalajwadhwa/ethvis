import React from "react";
import { Sigma } from "sigma";
import { NodeType, EdgeType } from "@/app/types/graph";

const NodeAttributes = ({
  hoveredNode,
  sigma,
}: {
  hoveredNode: string | null;
  sigma: Sigma<NodeType, EdgeType> | null;
}) => {
  if (!hoveredNode || !sigma) {
    return null;
  }

  const graph = sigma.getGraph();
  const customData = graph.getNodeAttribute(hoveredNode, "data");

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
      {customData && (
        <ul>
          {Object.entries(customData).map(([key, value]) => (
            <li key={key}>
              {key}: {value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NodeAttributes;
