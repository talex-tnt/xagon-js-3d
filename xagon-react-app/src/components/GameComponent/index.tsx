import React from 'react';
import useGameLogic from 'hooks/useGameLogic';
import SceneComponent from 'components/SceneComponent';

const GameComponent: React.FC = () => {
  const { onRender, onSceneReady } = useGameLogic();
  return (
    <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} />
  );
};

export default GameComponent;
