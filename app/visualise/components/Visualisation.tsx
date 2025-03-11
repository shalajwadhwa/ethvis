"use client";
import React, { useState, useEffect, useRef } from "react";
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import Sigma from "sigma";
import EthereumTracker from "@/app/lib/EthereumTracker";
import "@/app/visualise/style.css";
import { Attributes, EdgeType } from "@/app/types/graph";
import NodeAttributes from "@/app/visualise/components/NodeAttributes";
import Fa2Graph from "@/app/visualise/components/Fa2Graph";
import SidePanel from "@/app/visualise/components/SidePanel";
import { ModeToggle } from "@/app/components/theme-toggle";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import GraphInfo from "@/app/visualise/components/GraphInfo";
import { NodeSquareProgram } from "@sigma/node-square";
import VisualisationSelector from "@/app/visualise/components/VisualisationSelector";


const Visualisation = ({ visualisationType, setVisualisationType } : { visualisationType : string, setVisualisationType: React.Dispatch<React.SetStateAction<string>> }) => {
  const [sigma, setSigma] = useState<Sigma<Attributes, EdgeType> | null>(null);
  const client = useRef(EthereumApiClient.getInstance());
  const ethereumTracker = useRef(EthereumTracker.getInstance());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const sigmaSettings = {
    nodeProgramClasses: {
      square: NodeSquareProgram,
    },
    labelRenderedSizeThreshold: 100000
  };

  useEffect(() => {
    if (sigma) {
      ethereumTracker.current.setSigma(sigma);
      ethereumTracker.current.changeVisualisation(visualisationType);

      if (visualisationType === "default") {
        client.current.subscribeToPendingTransactions();
        client.current.subscribeToMinedTransactions();
      }
      else if (visualisationType === "static") {
        client.current.unsubscribeFromPendingTransactions();
        client.current.unsubscribeFromMinedTransactions();
        client.current.getTransactionsFromRange("1740152891", "1740153251");
      }
    }
    // todo: unsubscribe on unmount
  }, [sigma, visualisationType]);

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

          <NodeAttributes hoveredNode={hoveredNode} ethereumTracker={ethereumTracker.current}/>

          <VisualisationSelector setVisualisationType={setVisualisationType} />

          {sigma && <GraphInfo sigma={sigma} />}
          
          <ModeToggle />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={20}>
          <SidePanel ethereumTracker={ethereumTracker.current} />
        </ResizablePanel>
      </ResizablePanelGroup>
  );
};

export default Visualisation;
