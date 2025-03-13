import { Separator } from "@/components/ui/separator";
import React, { useEffect, useState } from "react";
import Sigma from "sigma";
import { Attributes, EdgeType } from "@/app/types/graph";
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType } from "@/app/types/event";
import EthereumTracker from "@/app/lib/EthereumTracker";

const GraphInfo = ({ sigma, ethereumTracker }: { sigma: Sigma<Attributes, EdgeType>, ethereumTracker: EthereumTracker }) => {
    const [nodes, setNodes] = useState<number>(0);
    const [edges, setEdges] = useState<number>(0);
    const [transactions, setTransactions] = useState<number>(0);

    useEffect(() => {
        const updateGraphInfo = () => {
            const graph = sigma.getGraph();
            setNodes(graph.order);
            setEdges(graph.size);
            setTransactions(ethereumTracker.getNumTransactions());
        };

        eventEmitter.on(EventType.NewPendingTransaction, updateGraphInfo);
    }
    , [sigma, ethereumTracker]);
  return (
    <div className="absolute bottom-4 left-4 z-10 graph-overlay">
      <div className="p-2.5 border rounded-md row-auto">
        <div className="flex h-5 items-center space-x-4 text-sm">
          <div>Nodes: {nodes}</div>
          <Separator orientation="vertical" />
          <div>Edges: {edges}</div>
          <Separator orientation="vertical" />
          <div>Transactions: {transactions}</div>
        </div>
      </div>
    </div>
  );
};

export default GraphInfo;
