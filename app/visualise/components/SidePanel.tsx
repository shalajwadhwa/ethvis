import EthereumTracker from "@/app/lib/EthereumTracker";
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType } from "@/app/types/event";
import React, { useEffect, useState } from "react";
import PanelItem from "@/app/visualise/components/PanelItem";
import { Attributes } from "@/app/types/graph";
import { ScrollArea } from "@/components/ui/scroll-area";

const SidePanel = ({
  ethereumTracker,
}: {
  ethereumTracker: EthereumTracker;
}) => {
  const [nodes, setNodes] = useState(ethereumTracker.getTopNodes());

  useEffect(() => {
    const updateAttributes = () => {
      setNodes([...ethereumTracker.getTopNodes()]);
    };

    eventEmitter.on(EventType.NewTopNode, updateAttributes);

  }, [ethereumTracker]);

  return (
      <ScrollArea className="p-4 h-screen w-full overflow-y-auto">
        <ul>
          {Array.from(nodes.values()).map((node: Attributes, index: number) => (
            <li key={index} className="py-1.5">
              <PanelItem attributes={node as Attributes}/>
            </li>
          ))}
        </ul>
      </ScrollArea>
  );
};

export default SidePanel;
