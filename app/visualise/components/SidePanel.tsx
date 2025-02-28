import EthereumTracker from "@/app/lib/EthereumTracker";
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType } from "@/app/types/event";
import React, { useEffect, useState } from "react";
import PanelItem from "@/app/visualise/components/PanelItem";
import { AddressInfo } from "@/app/types/graph";

const SidePanel = ({
  ethereumTracker,
}: {
  ethereumTracker: EthereumTracker;
}) => {
  const [nodes, setNodes] = useState(ethereumTracker.getNodes());

  useEffect(() => {
    const updateAttributes = () => {
      setNodes(new Map(ethereumTracker.getNodes()));
    };

    eventEmitter.on(EventType.AddTransactionToGraph, updateAttributes);
    eventEmitter.on(EventType.UpdateNodeNetBalance, updateAttributes);

  }, [ethereumTracker]);

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        padding: "8px",
        borderRadius: "5px",
        maxHeight: "50vh",
        maxWidth: "20vw",
        overflowY: "auto",
      }}
    >
      <ul>
        {[...nodes]
          .sort((a, b) => ((b[1] as AddressInfo).netBalance ?? 0) - ((a[1] as AddressInfo).netBalance ?? 0))
          .map(([key, value]) => (
            <li key={key} style={{ padding: "5px" }}>
              <PanelItem addressInfo={value as AddressInfo} />
            </li>
          ))}
      </ul>
    </div>
  );
};

export default SidePanel;
