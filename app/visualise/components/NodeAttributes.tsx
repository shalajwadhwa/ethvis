import React from "react";
import { EthereumTracker } from "@/app/lib/";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Attributes } from "@/app/types/";

const NodeAttributes = ({
  hoveredNode,
  ethereumTracker,
}: {
  hoveredNode: string | null;
  ethereumTracker: EthereumTracker | null;
}) => {
  if (!ethereumTracker || !hoveredNode) {
    return null;
  }

  const attributes = ethereumTracker.getNodeAttributes(hoveredNode);
  
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
    <Card className="absolute top-4 left-4 z-10 graph-overlay">
      <CardHeader className="pb-1">
        <CardTitle className="text-md">Node Details</CardTitle>
      </CardHeader>
      <CardContent>
        {attributes && (
          <ul className="space-y-0">
            {attributesToShow.map((key) => {
              const value = attributes[key as keyof Attributes];
              
              if (value === undefined || value === null || value === '') {
                return null;
              }
              
              return (
                <li key={key} className="flex justify-between">
                  <span className="font-small">{key}:</span>
                  <span>
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
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default NodeAttributes;
