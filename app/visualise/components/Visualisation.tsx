"use client";
import React, { useState, useEffect, useRef } from "react";
import { EthereumApiClient, EthereumTracker } from "@/app/lib/";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import Sigma from "sigma";
import "@/app/visualise/style.css";
import { Attributes, EdgeType } from "@/app/types/";
import { NodeAttributes, Fa2Graph, SidePanel, GraphInfo, VisualisationSelector } from "@/app/visualise/components/";
import { ModeToggle } from "@/components/ui/theme-toggle";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { NodeSquareProgram } from "@sigma/node-square";


const Visualisation = ({ visualisationType, setVisualisationType } : { visualisationType : string, setVisualisationType: React.Dispatch<React.SetStateAction<string>> }) => {
  const [sigma, setSigma] = useState<Sigma<Attributes, EdgeType> | null>(null);
  const client = useRef(EthereumApiClient.getInstance());
  const [ethereumTracker, setEthereumTracker] = useState<EthereumTracker | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const sigmaSettings = {
    nodeProgramClasses: {
      square: NodeSquareProgram,
    },
    labelRenderedSizeThreshold: 100000
  };

  useEffect(() => {
    if (sigma && !ethereumTracker) {
      setEthereumTracker(new EthereumTracker(sigma));
      console.log("EthereumTracker initialised with sigma instance");
    }
  }, [sigma, ethereumTracker]);

  useEffect(() => {
    if (!sigma || !ethereumTracker) return;
    
    ethereumTracker.changeVisualisation(visualisationType);

    if (visualisationType === "default") {
      client.current.subscribeToPendingTransactions();
      client.current.subscribeToMinedTransactions();
    }
    else if (visualisationType === "static") {
      client.current.unsubscribeFromPendingTransactions();
      client.current.unsubscribeFromMinedTransactions();
      client.current.getTransactionsFromRange("1740152891", "1740153251");
    }
  }, [sigma, ethereumTracker, visualisationType]);

  useEffect(() => {
    if (!sigma || !ethereumTracker) return;

    ethereumTracker.selectNode(hoveredNode);

  }, [sigma, ethereumTracker, hoveredNode]);

  return (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} className="relative">
          <SigmaContainer<Attributes, EdgeType> 
            ref={setSigma} 
            settings={sigmaSettings} 
            className="w-full h-screen"
          >
            <Fa2Graph setHoveredNode={setHoveredNode} />
          </SigmaContainer>

          {ethereumTracker && (
            <NodeAttributes 
              hoveredNode={hoveredNode} 
              ethereumTracker={ethereumTracker} 
            />
          )}

          <VisualisationSelector setVisualisationType={setVisualisationType} />

          {sigma && ethereumTracker && <GraphInfo sigma={sigma} ethereumTracker={ethereumTracker}/>}
          
          <ModeToggle />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={20}>
          {ethereumTracker && (
            <SidePanel 
              ethereumTracker={ethereumTracker} 
              setHoveredNode={setHoveredNode} 
            />
          )}
        </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Visualisation;
