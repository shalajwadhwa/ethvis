import React from "react";

const SidePanel = () => {
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
      }}
    >
      <ul>
        <li>Node attributes</li>
        <li>Edge attributes</li>
      </ul>
    </div>
  );
};

export default SidePanel;
