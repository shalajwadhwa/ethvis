import React from "react";
import { Attributes } from "@/app/types/";

const PanelItem = ({
  attributes,
  setHoveredNode,
}: {
  attributes: Attributes;
  setHoveredNode: (nodeAddress: string | null) => void;
}) => {
  const attributesToShow = [
    "address",
    "netBalance",
    "numTransactions",
    "name",
    "nameTag",
    "label",
    "website",
    "symbol",
    "isContract",
  ];

  return (
    <ul className="p-2.5 border rounded-md break-all">
      {attributesToShow.map((key) => {
        const value = attributes[key as keyof Attributes];
        
        if (value === undefined || value === null || value === '') {
          return null;
        }
        
        return (
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
              `${value.toString()} ETH`
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
        );
      })}
    </ul>
  );
};

export default PanelItem;
