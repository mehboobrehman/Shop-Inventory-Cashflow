import React from "react";
import { Composition } from "remotion";
import "./index.css";
import { ShopInventoryTutorial } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ShopInventoryTutorial"
        component={ShopInventoryTutorial}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
