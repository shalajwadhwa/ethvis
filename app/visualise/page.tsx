"use client";
import React, { useState, useEffect, useRef } from "react";
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import GraphHandler from "@/app/lib/GraphHandler";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import Sigma from "sigma";
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType } from "@/app/types/event";
import EthereumTracker from "@/app/lib/EthereumTracker";
import "@/app/visualise/style.css";
import { NodeType, EdgeType } from "@/app/types/graph";
import NodeAttributes from "@/app/visualise/components/NodeAttributes";
import Fa2Graph from "@/app/visualise/components/Fa2Graph";
import SidePanel from "@/app/visualise/components/SidePanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const VisualisePage = () => {
  const [sigma, setSigma] = useState<Sigma<NodeType, EdgeType> | null>(null);
  const client = useRef(EthereumApiClient.getInstance());
  const ethereumTracker = useRef(EthereumTracker.getInstance());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (sigma) {
      client.current.subscribeToPendingTransactions();
      sigma.setSetting("labelRenderedSizeThreshold", 100000);
      eventEmitter.on(EventType.NewPendingTransaction, (tx) =>
        ethereumTracker.current.addPendingTransaction(tx)
      );
      eventEmitter.on(EventType.AddAddressToGraph, (address, isContract) =>
        GraphHandler.addNode(sigma, address, isContract)
      );
      eventEmitter.on(EventType.AddTransactionToGraph, (tx) =>
        GraphHandler.addTransaction(sigma, tx)
      );
      eventEmitter.on(
        EventType.UpdateNodeNetBalance,
        (tx, netBalance, is_sender) =>
          GraphHandler.updateNodeColour(sigma, tx, netBalance, is_sender)
      );
    }
  }, [sigma]);

  return (
      <ResizablePanelGroup direction="horizontal" className="flex h-screen">
        <ResizablePanel defaultSize={80} className="relative">
          <SigmaContainer ref={setSigma} className="w-full h-screen">
            <Fa2Graph setHoveredNode={setHoveredNode} />
          </SigmaContainer>

          <NodeAttributes hoveredNode={hoveredNode} ethereumTracker={ethereumTracker.current}/>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={20} className="relative">
          <SidePanel ethereumTracker={ethereumTracker.current} />
        </ResizablePanel>
      </ResizablePanelGroup>
  );
};

export default VisualisePage;
