import EthereumTracker from "@/app/lib/EthereumTracker";
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType } from "@/app/types/event";
import React, { useEffect, useState } from "react";

const SidePanel = ({
  ethereumTracker,
}: {
  ethereumTracker: EthereumTracker;
}) => {
  const [nodeAttributes, setNodeAttributes] = useState(ethereumTracker.getAllNodeAttributes());

  useEffect(() => {
    const updateAttributes = () => {
      setNodeAttributes(ethereumTracker.getAllNodeAttributes());
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
        background: "rgba(0,0,0,0.7)",
        color: "white",
        borderRadius: "5px",
        maxHeight: "50vh",
        maxWidth: "20vw",
        overflowY: "auto",
      }}
    >
      <ul>
        {[...nodeAttributes].map(([key, value]) => (
          <li key={key}>
            {key}: {JSON.stringify(value)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidePanel;
