import EthereumTracker from "@/app/lib/EthereumTracker";
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType, Attributes } from "@/app/types/";
import React, { useEffect, useState } from "react";
import PanelItem from "@/app/visualise/components/PanelItem";
import { ScrollArea } from "@/components/ui/scroll-area";

const SidePanel = ({
  ethereumTracker,
  setHoveredNode,
}: {
  ethereumTracker: EthereumTracker | null;
  setHoveredNode: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const [nodes, setNodes] = useState(ethereumTracker ? ethereumTracker.getTopNodes() : []);

  useEffect(() => {
    const updateAttributes = () => {
      if (ethereumTracker) {
        setNodes([...ethereumTracker.getTopNodes()]);
      }
    };

    eventEmitter.on(EventType.NewTopNode, updateAttributes);
    
    return () => {
      eventEmitter.off(EventType.NewTopNode, updateAttributes);
    };
  }, [ethereumTracker]);

  return (
      <ScrollArea className="p-4 h-screen w-full overflow-y-auto">
        <ul>
          {Array.from(nodes.values()).map((node: Attributes, index: number) => (
            <li key={index} className="py-1.5">
              <PanelItem attributes={node as Attributes} setHoveredNode={setHoveredNode}/>
            </li>
          ))}
        </ul>
      </ScrollArea>
  );
};

export default SidePanel;
