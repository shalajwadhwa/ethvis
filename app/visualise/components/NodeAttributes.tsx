import React from "react";
import EthereumTracker from "@/app/lib/EthereumTracker";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

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

  const attributes = ethereumTracker.getNodeAttributes(hoveredNode);

  return (
    <Card className="absolute top-4 left-4 z-10 graph-overlay">
      <CardHeader className="pb-1">
        <CardTitle className="text-md">Node Details</CardTitle>
      </CardHeader>
      <CardContent>
        {attributes && (
          <ul className="space-y-0">
            {Object.entries(attributes).map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span className="font-small">{key}:</span>
                <span>
                  {key === 'isContract'
                    ? value.toString()
                    : key === 'netBalance'
                    ? `${(Number(value) / 10**18).toFixed(4)} ETH`
                    : value}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default NodeAttributes;
