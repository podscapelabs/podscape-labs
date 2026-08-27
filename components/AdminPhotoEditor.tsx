"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

type AdminPhotoEditorProps = {
  image: string | null;
  imagePositionX: number;
  imagePositionY: number;
  imageZoom: number;
};

export function AdminPhotoEditor({ image, imagePositionX, imagePositionY, imageZoom }: AdminPhotoEditorProps) {
  const inputId = useId();
  const [preview, setPreview] = useState(image);
  const [positionX, setPositionX] = useState(imagePositionX);
  const [positionY, setPositionY] = useState(imagePositionY);
  const [zoom, setZoom] = useState(imageZoom);

  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  return <div className="admin-photo-editor">
    <div className="admin-photo-preview" aria-label="Circular species emblem preview">
      {preview ? <Image src={preview} alt="Photo crop preview" fill unoptimized={preview.startsWith("blob:")} style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})` }} /> : <span><b>Photo</b><small>not uploaded</small></span>}
    </div>
    <div className="admin-photo-controls">
      <label className="admin-photo-drop" htmlFor={inputId}><span>Choose or drop a photograph</span><small>JPG, PNG, or WebP · maximum 12 MB</small><input id={inputId} name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }} /></label>
      <label><span>Horizontal framing <output>{positionX}%</output></span><input name="imagePositionX" type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} /></label>
      <label><span>Vertical framing <output>{positionY}%</output></span><input name="imagePositionY" type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} /></label>
      <label><span>Zoom <output>{zoom.toFixed(2)}×</output></span><input name="imageZoom" type="range" min="1" max="2" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
    </div>
  </div>;
}
