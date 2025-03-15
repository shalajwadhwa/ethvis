"use client";
import React, { useState, useEffect, useRef } from "react";
import { EthereumApiClient, EthereumTracker } from "@/app/lib/";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import Sigma from "sigma";
import "@/app/visualise/style.css";
import { Attributes, EdgeType } from "@/app/types/";
import { NodeAttributes, Fa2Graph, SidePanel, GraphInfo, VisualisationSelector } from "@/app/visualise/components/";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
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
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
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

    if (!isRunning) {
      client.current.unsubscribeFromPendingTransactions();
      client.current.unsubscribeFromMinedTransactions();
    } else {
      if (visualisationType === "default") {
        client.current.subscribeToPendingTransactions();
        client.current.subscribeToMinedTransactions();
      } else if (visualisationType === "static") {
        client.current.getTransactionsFromRange("1740152891", "1740153251");
      }
    }
  }, [sigma, ethereumTracker, visualisationType, isRunning]);

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

          <div className="absolute bottom-4 left-0 right-0 z-10 px-4 flex flex-col">
            <div className="flex justify-between items-center">
              <div></div>
              <div>
                <ThemeToggle />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                {sigma && ethereumTracker && <GraphInfo sigma={sigma} ethereumTracker={ethereumTracker}/>}
              </div>
              <div>
                <Button 
                  onClick={() => setIsRunning(!isRunning)}
                  variant={isRunning ? "destructive" : "default"}
                  className="transition-colors"
                >
                    {isRunning ? "Stop Visualisation" : "Start Visualisation"}
                </Button>
              </div>
            </div>
          </div>

        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={20}>
          {ethereumTracker && (
            <SidePanel 
              ethereumTracker={ethereumTracker}
            />
          )}
        </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Visualisation;
