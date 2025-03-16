import EthereumTracker from "@/app/lib/EthereumTracker";
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType, Attributes } from "@/app/lib/types";
import React, { useEffect, useState } from "react";
import { PanelItem } from "@/app/visualise/components/";
import { ScrollArea } from "@/components/ui/scroll-area";

const SidePanel = ({
  ethereumTracker,
}: {
  ethereumTracker: EthereumTracker;
}) => {
  const [nodes, setNodes] = useState(ethereumTracker ? ethereumTracker.getTopNodes() : []);

  useEffect(() => {
    const updateAttributes = () => {
      if (ethereumTracker) {
        setNodes([...ethereumTracker.getTopNodes()]);
      }
    };

    eventEmitter.on(EventType.GraphUpdate, updateAttributes);
  }, [ethereumTracker]);

  return (
      <ScrollArea className="p-4 h-screen w-full overflow-y-auto">
        <ul>
          {Array.from(nodes.values()).map((node: Attributes, index: number) => (
            <li key={index} className="py-1.5">
              <PanelItem attributes={node as Attributes} setHoveredNode={(node: string | null) => ethereumTracker.selectNode(node)}/>
            </li>
          ))}
        </ul>
      </ScrollArea>
  );
};

export default SidePanel;
