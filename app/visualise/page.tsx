'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import EthereumApiClient from '@/app/lib/EthereumApiClient';
import GraphHandler from "@/app/lib/GraphHandler";
import { SigmaContainer, useRegisterEvents } from '@react-sigma/core';
import "@react-sigma/core/lib/style.css";
import Sigma from 'sigma';
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { ForceAtlas2LayoutParameters } from 'graphology-layout-forceatlas2';
import eventEmitter from '@/app/lib/EventEmitter';
import { EventType } from '@/app/types/event';
import EthereumTracker from '@/app/lib/EthereumTracker';
import '@/app/visualise/style.css';

type NodeType = { x: number; y: number; label: string; size: number; data: { attr?: any } };
type EdgeType = { label: string };

const Fa2Graph = ({ setHoveredNode }: { setHoveredNode: React.Dispatch<React.SetStateAction<string | null>> }) => {
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

  if (!isRunning) {
    console.log("starting FA2");
    start();
  }

  useEffect(() => {
      registerEvents({
        enterNode: (event) => {
          setHoveredNode(event.node);
        },
        leaveNode: () => {
          setHoveredNode(null);
        },
      });
  }, [registerEvents, setHoveredNode]);

  return <div></div>;
};

const VisualisePage = () => {
  const [sigma, setSigma] = useState<Sigma<NodeType, EdgeType> | null>(null);
  const client = useRef(EthereumApiClient.getInstance());
  const ethereumTracker = useRef(EthereumTracker.getInstance());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
      if (sigma) {
        client.current.subscribeToPendingTransactions();
        sigma.setSetting('labelRenderedSizeThreshold', 100000);
        eventEmitter.on(EventType.NewPendingTransaction, (tx) => ethereumTracker.current.addPendingTransaction(tx));
        eventEmitter.on(EventType.AddAddressToGraph, (address, attributes) => GraphHandler.addNode(sigma, address, attributes));
        eventEmitter.on(EventType.AddTransactionToGraph, (tx) => GraphHandler.addTransaction(sigma, tx));
        eventEmitter.on(EventType.UpdateNodeNetBalance, (tx, netBalance, is_sender) => GraphHandler.updateNodeColour(sigma, tx, netBalance, is_sender));
      }
  }, [sigma]);

  // Retrieve tooltip data once sigma and hoveredNode are available.
  const tooltipContent = hoveredNode && sigma ? (() => {
      const graph = sigma.getGraph();
      const label = graph.getNodeAttribute(hoveredNode, "label");
      const customData = graph.getNodeAttribute(hoveredNode, "data");
      return { label, customData };
  })() : null;

  return (
      <div className='dark-mode'>
          <h1>Visualization Page</h1>
          <Link href='/'>Back to home</Link>
          <SigmaContainer ref={setSigma} style={{ width: '100vw', height: '100vh' }}>
              <Fa2Graph setHoveredNode={setHoveredNode} />
              {hoveredNode && tooltipContent && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    padding: "8px",
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    borderRadius: "5px",
                  }}
                >
                  {tooltipContent.customData && (
                    <ul>
                      {Object.entries(tooltipContent.customData).map(([key, value]) => (
                        <li key={key}>
                          {key}: {value}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
          </SigmaContainer>
      </div>
  );
};

export default VisualisePage;