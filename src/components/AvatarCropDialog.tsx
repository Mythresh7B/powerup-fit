import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AvatarCropDialogProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onCrop: (blob: Blob) => void;
}

const CROP_SIZE = 256;

const AvatarCropDialog = ({ file, open, onClose, onCrop }: AvatarCropDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load image when file changes
  useEffect(() => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  // Draw preview
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displaySize = canvas.clientWidth;
    canvas.width = displaySize;
    canvas.height = displaySize;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // Fill bg
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, displaySize, displaySize);

    // Calculate scaled image dimensions to fit-cover
    const scale = zoom * Math.max(displaySize / img.width, displaySize / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (displaySize - w) / 2 + offset.x;
    const y = (displaySize - h) / 2 + offset.y;

    // Draw circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(displaySize / 2, displaySize / 2, displaySize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Draw dark overlay outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, displaySize, displaySize);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(displaySize / 2, displaySize / 2, displaySize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [zoom, offset]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handlePointerUp = () => setDragging(false);

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = CROP_SIZE;
    outCanvas.height = CROP_SIZE;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    const displaySize = canvasRef.current?.clientWidth || 280;
    const scale = zoom * Math.max(displaySize / img.width, displaySize / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (displaySize - w) / 2 + offset.x;
    const y = (displaySize - h) / 2 + offset.y;

    // Map to output
    const ratio = CROP_SIZE / displaySize;
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x * ratio, y * ratio, w * ratio, h * ratio);

    outCanvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      'image/jpeg',
      0.85
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Crop Avatar</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            className="w-[280px] h-[280px] rounded-full cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div className="w-full flex items-center gap-3 px-2">
            <span className="text-xs font-mono text-muted-foreground">Zoom</span>
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="font-mono">Cancel</Button>
          <Button onClick={handleCrop} className="font-mono">Save Avatar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropDialog;
