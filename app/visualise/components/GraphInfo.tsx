import { Separator } from "@/components/ui/separator";
import React, { useEffect, useState } from "react";
import Sigma from "sigma";
import { Attributes, EdgeType, EventType } from "@/app/types/";
import { EthereumTracker, eventEmitter } from "@/app/lib/";

const GraphInfo = ({ sigma, ethereumTracker }: { sigma: Sigma<Attributes, EdgeType>, ethereumTracker: EthereumTracker }) => {
    const [nodes, setNodes] = useState<number>(0);
    const [edges, setEdges] = useState<number>(0);
    const [transactions, setTransactions] = useState<number>(0);
    const [contracts, setContracts] = useState<number>(0);
    const [contractExecutions, setContractExecutions] = useState<number>(0);

    useEffect(() => {
        const updateGraphInfo = () => {
            const graph = sigma.getGraph();
            setNodes(graph.order);
            setEdges(graph.size);
            setTransactions(ethereumTracker.getNumTransactions());
            setContracts(ethereumTracker.getNumContracts());
            setContractExecutions(ethereumTracker.getNumContractExecutions());
        };

        eventEmitter.on(EventType.NewPendingTransaction, updateGraphInfo);
    }
    , [sigma, ethereumTracker]);
  return (
    <div className="graph-overlay">
      <div className="p-2.5 border rounded-md row-auto">
        <div className="flex h-5 items-center space-x-4 text-sm">
          <div>Nodes: {nodes}</div>
          <Separator orientation="vertical" />
          <div>Edges: {edges}</div>
          <Separator orientation="vertical" />
          <div>Transactions: {transactions}</div>
          <Separator orientation="vertical" />
          <div>Contracts: {contracts}</div>
          <Separator orientation="vertical" />
          <div>Contract Executions: {contractExecutions}</div>
        </div>
      </div>
    </div>
  );
};

export default GraphInfo;
