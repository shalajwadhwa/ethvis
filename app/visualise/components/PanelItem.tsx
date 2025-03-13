import React from "react";
import { Attributes } from "@/app/types/graph";

const PanelItem = ({
  attributes,
  setHoveredNode,
}: {
  attributes: Attributes;
  setHoveredNode: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  return (
    <ul className="p-2.5 border rounded-md break-all">
      {Object.entries(attributes).map(([key, value]) => (
        <li 
          key={key}
          {...(key === "address" ? {
            onMouseEnter: () => setHoveredNode(String(value)),
            onMouseLeave: () => setHoveredNode(null)
          } : {})}
        >
          {key}:{" "}
          {key === "isContract" ? (
            value.toString()
          ) : key === "netBalance" ? (
            value.toString()
          ) : key === "address" ? (
            <a
              href={`https://etherscan.io/address/${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 dark:text-blue-400 hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )}
        </li>
      ))}
    </ul>
  );
};

export default PanelItem;
