import { lazy, Suspense } from 'react';
import CharacterSkeleton from './CharacterSkeleton';
import CharacterErrorBoundary from './CharacterErrorBoundary';

const CharacterCanvas = lazy(() => import('./CharacterCanvas'));

interface CharacterViewerProps {
  level: number;
  username: string;
}

const CharacterViewer = ({ level, username }: CharacterViewerProps) => {
  return (
    <CharacterErrorBoundary level={level} username={username}>
      <Suspense fallback={<CharacterSkeleton />}>
        <CharacterCanvas level={level} />
      </Suspense>
    </CharacterErrorBoundary>
  );
};

export default CharacterViewer;
