import { Separator } from "@/components/ui/separator";
import React, { useEffect, useState } from "react";
import Sigma from "sigma";
import { NodeType, EdgeType } from "@/app/types/graph";
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType } from "@/app/types/event";

const GraphInfo = ({ sigma }: { sigma: Sigma<NodeType, EdgeType> }) => {
    const [nodes, setNodes] = useState<number>(0);
    const [edges, setEdges] = useState<number>(0);

    useEffect(() => {
        const updateGraphInfo = () => {
            const graph = sigma.getGraph();
            setNodes(graph.order);
            setEdges(graph.size);
        };

        eventEmitter.on(EventType.AddAddressToGraph, updateGraphInfo);
        eventEmitter.on(EventType.RemoveAddressFromGraph, updateGraphInfo);
        eventEmitter.on(EventType.AddTransactionToGraph, updateGraphInfo);
    }
    , [sigma]);
  return (
    <div className="p-2.5 border rounded-md row-auto">
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Nodes: {nodes}</div>
        <Separator orientation="vertical" />
        <div>Edges: {edges}</div>
      </div>
    </div>
  );
};

export default GraphInfo;
