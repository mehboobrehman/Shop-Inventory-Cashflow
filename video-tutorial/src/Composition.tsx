import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Background } from "./components/Background";
import { SceneHeader } from "./components/SceneHeader";
import { Scene1Hero } from "./components/Scene1Hero";
import { Scene2Inventory } from "./components/Scene2Inventory";
import { Scene3POS } from "./components/Scene3POS";
import { Scene4Cashflow } from "./components/Scene4Cashflow";
import { Scene5Analytics } from "./components/Scene5Analytics";
import { Scene6Outro } from "./components/Scene6Outro";

export const ShopInventoryTutorial: React.FC = () => {
  const frame = useCurrentFrame();

  // Determine current active scene for header indicator
  let currentSceneNumber = 1;
  let moduleName = "System Intro";

  if (frame >= 750) {
    currentSceneNumber = 6;
    moduleName = "Portable Deployment";
  } else if (frame >= 600) {
    currentSceneNumber = 5;
    moduleName = "Executive Analytics";
  } else if (frame >= 450) {
    currentSceneNumber = 4;
    moduleName = "Cashflow & Security";
  } else if (frame >= 300) {
    currentSceneNumber = 3;
    moduleName = "POS Checkout Engine";
  } else if (frame >= 150) {
    currentSceneNumber = 2;
    moduleName = "Inventory & Barcodes";
  }

  return (
    <AbsoluteFill>
      {/* Background with Ambient Glowing Particles & Tech Grid */}
      <Background />

      {/* Top Header Bar & Progress Indicator */}
      <SceneHeader
        currentSceneNumber={currentSceneNumber}
        totalScenes={6}
        moduleName={moduleName}
      />

      {/* Scene Sequences (150 frames / 5 seconds per scene) */}

      {/* Scene 1: Title & Hero Intro (0 - 150) */}
      <Sequence durationInFrames={150}>
        <Scene1Hero />
      </Sequence>

      {/* Scene 2: Inventory & Product Management (150 - 300) */}
      <Sequence from={150} durationInFrames={150}>
        <Scene2Inventory />
      </Sequence>

      {/* Scene 3: POS Terminal & Checkout Engine (300 - 450) */}
      <Sequence from={300} durationInFrames={150}>
        <Scene3POS />
      </Sequence>

      {/* Scene 4: Cashflow & Account Security (450 - 600) */}
      <Sequence from={450} durationInFrames={150}>
        <Scene4Cashflow />
      </Sequence>

      {/* Scene 5: Real-Time Analytics Dashboard (600 - 750) */}
      <Sequence from={600} durationInFrames={150}>
        <Scene5Analytics />
      </Sequence>

      {/* Scene 6: Portable Deployment & Outro (750 - 900) */}
      <Sequence from={750} durationInFrames={150}>
        <Scene6Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
