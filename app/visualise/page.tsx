"use client";
import React, { useState, useEffect, useRef } from "react";
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import Sigma from "sigma";
import EthereumTracker from "@/app/lib/EthereumTracker";
import "@/app/visualise/style.css";
import { NodeType, EdgeType } from "@/app/types/graph";
import NodeAttributes from "@/app/visualise/components/NodeAttributes";
import Fa2Graph from "@/app/visualise/components/Fa2Graph";
import SidePanel from "@/app/visualise/components/SidePanel";
import { ModeToggle } from "@/app/components/theme-toggle";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import GraphInfo from "./components/GraphInfo";
import { NodeSquareProgram } from "@sigma/node-square";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const VisualisePage = () => {
  const [sigma, setSigma] = useState<Sigma<NodeType, EdgeType> | null>(null);
  const client = useRef(EthereumApiClient.getInstance());
  const ethereumTracker = useRef(EthereumTracker.getInstance());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [visualisationType, setVisualisationType] = useState<string>("default");

  const sigmaSettings = {
    nodeProgramClasses: {
      square: NodeSquareProgram,
    },
    labelRenderedSizeThreshold: 100000
  };

  useEffect(() => {
    if (sigma) {
      client.current.subscribeToPendingTransactions();
      client.current.subscribeToMinedTransactions();
      ethereumTracker.current.setSigma(sigma);
      ethereumTracker.current.changeVisualisation(visualisationType);
    }
  }, [sigma, visualisationType]);

  return (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} className="relative">
          <SigmaContainer ref={setSigma} settings={sigmaSettings} className="w-full h-screen">
            <Fa2Graph setHoveredNode={setHoveredNode} />
          </SigmaContainer>

          <NodeAttributes hoveredNode={hoveredNode} ethereumTracker={ethereumTracker.current}/>

          <div className="absolute top-4 right-4 z-10 graph-overlay">
            <Select onValueChange={(value) => setVisualisationType(value)}>
              <SelectTrigger className="w">
                <SelectValue placeholder="Settings" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Settings</SelectLabel>
                  <SelectItem value="default">Real-time (default)</SelectItem>
                  <SelectItem value="validation">Real-time with Validation</SelectItem>
                  <SelectItem value="validation">Static</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {sigma && <GraphInfo sigma={sigma} />}

          <div className="absolute bottom-4 right-4 z-10">
            <ModeToggle />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={20}>
          <SidePanel ethereumTracker={ethereumTracker.current} />
        </ResizablePanel>
      </ResizablePanelGroup>
  );
};

export default VisualisePage;
