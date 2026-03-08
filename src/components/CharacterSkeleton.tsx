const CharacterSkeleton = () => {
  const pulseClass = 'animate-pulse rounded-md';

  return (
    <div className="w-full flex flex-col items-center justify-center" style={{ height: 400 }}>
      <div className="flex flex-col items-center gap-2">
        {/* Head */}
        <div className={`${pulseClass} w-[60px] h-[60px] rounded-full bg-muted`} />
        {/* Torso */}
        <div className={`${pulseClass} w-[80px] h-[120px] bg-muted`} />
        {/* Arms */}
        <div className="flex gap-[60px] -mt-[100px]">
          <div className={`${pulseClass} w-[18px] h-[70px] bg-muted`} />
          <div className={`${pulseClass} w-[18px] h-[70px] bg-muted`} />
        </div>
        {/* Legs */}
        <div className="flex gap-3 mt-2">
          <div className={`${pulseClass} w-[24px] h-[60px] bg-muted`} />
          <div className={`${pulseClass} w-[24px] h-[60px] bg-muted`} />
        </div>
      </div>
      <p className="text-xs font-mono text-muted-foreground mt-4">Loading warrior...</p>
    </div>
  );
};

export default CharacterSkeleton;
