import React, { useEffect, useState } from "react";
import { ForceAtlas2LayoutParameters } from "graphology-layout-forceatlas2";
// import { useSigma } from "@react-sigma/core";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { useRegisterEvents } from "@react-sigma/core";
// import { NodeType, EdgeType } from "@/app/types/graph";

const Fa2Graph = ({
  setHoveredNode,
}: {
  setHoveredNode: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const [isNodeClicked, setIsNodeClicked] = useState(false);
  
  const options: ForceAtlas2LayoutParameters = {
    settings: {
      linLogMode: false,
      outboundAttractionDistribution: false,
      adjustSizes: false,
      edgeWeightInfluence: 1,
      scalingRatio: 0.01,
      strongGravityMode: true,
      gravity: 1,
      barnesHutOptimize: true,
      barnesHutTheta: 0.9,
      slowDown: 20,
    },
  };

  const { start, stop, isRunning } = useWorkerLayoutForceAtlas2(options);
  const registerEvents = useRegisterEvents();
  // const sigma = useSigma<NodeType, EdgeType>();

  if (!isRunning) {
    console.log("starting FA2");
    start();
  }

  useEffect(() => {
    registerEvents({
      enterNode: (event) => {
        if (!isNodeClicked) {
          setHoveredNode(event.node);
        }
      },
      leaveNode: () => {
        if (!isNodeClicked) {
          setHoveredNode(null);
        }
      },
      clickNode: (event) => {
        setIsNodeClicked(true);
        setHoveredNode(event.node);
      },
      clickStage: () => {
        setIsNodeClicked(false);
        setHoveredNode(null);
      },
    });
  }, [registerEvents, setHoveredNode, isNodeClicked]);

  return <div></div>;
};

export default Fa2Graph;
