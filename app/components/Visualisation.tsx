import React, { useState, useEffect, useRef } from "react";
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import EthereumTracker from "@/app/lib/EthereumTracker";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import Sigma from "sigma";
import "@/app/style.css";
import { Attributes, EdgeType, VisualisationType } from "@/app/lib/types";
import NodeAttributes from "@/app/components/NodeAttributes";
import Fa2Graph from "@/app/components/Fa2Graph";
import SidePanel from "@/app/components/SidePanel";
import GraphInfo from "@/app/components/GraphInfo";
import VisualisationSelector from "@/app/components/VisualisationSelector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { NodeSquareProgram } from "@sigma/node-square";


const Visualisation = ({ visualisationType, setVisualisationType } : { visualisationType : VisualisationType, setVisualisationType: React.Dispatch<React.SetStateAction<VisualisationType>> }) => {
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
      setEthereumTracker(new EthereumTracker(sigma, visualisationType));
      console.log("EthereumTracker initialised with sigma instance");
    }
  }, [sigma, ethereumTracker, visualisationType]);

  useEffect(() => {
    if (!sigma || !ethereumTracker) return;
    
    ethereumTracker.changeVisualisation(visualisationType);

    if (isRunning) {
      if (visualisationType === VisualisationType.DEFAULT) {
        client.current.subscribeToPendingTransactions();
        client.current.subscribeToMinedTransactions();
      } else if (visualisationType === VisualisationType.RANGE) {
        client.current.setHalt(false);
        client.current.getTransactionsFromRange("1740152890", "1740153251");
      }
    } 
    else {
      client.current.setHalt(true);
      client.current.unsubscribeFromPendingTransactions();
      client.current.unsubscribeFromMinedTransactions();
    }
  }, [sigma, ethereumTracker, visualisationType, isRunning]);

  return (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} className="relative">
          <SigmaContainer<Attributes, EdgeType> ref={setSigma} settings={sigmaSettings} className="w-full h-screen">
            <Fa2Graph setHoveredNode={setHoveredNode} />
          </SigmaContainer>

          {ethereumTracker && (
            <NodeAttributes hoveredNode={hoveredNode} ethereumTracker={ethereumTracker} />
          )}

          <VisualisationSelector visualisationType={visualisationType} setVisualisationType={setVisualisationType} setIsRunning={setIsRunning} />

          <div className="absolute bottom-4 left-0 right-0 z-10 px-4 flex flex-col">
            <div className="flex justify-between items-center">
              <div></div>
              <div>
                <ThemeToggle />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                {ethereumTracker && <GraphInfo ethereumTracker={ethereumTracker}/>}
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
          {ethereumTracker && <SidePanel ethereumTracker={ethereumTracker} />}
        </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Visualisation;
