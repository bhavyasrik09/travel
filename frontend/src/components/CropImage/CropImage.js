import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import { getCroppedImg } from "./cropUtils"; // helper function to get cropped blob
import "./CropImage.css";

export default function CropImage({ imageSrc, onCancel, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);
  const onRotationChange = (rotation) => setRotation(rotation);

  const onCropCompleteInternal = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedBlob); // Pass blob to parent component
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  return (
    <div className="crop-image-container">
      <div className="cropper-wrapper">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={4 / 3}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>

      <div className="crop-controls">
        <div className="slider-container">
          <label>Zoom</label>
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e, value) => setZoom(value)}
          />
        </div>
        <div className="slider-container">
          <label>Rotate</label>
          <Slider
            min={0}
            max={360}
            step={1}
            value={rotation}
            onChange={(e, value) => setRotation(value)}
          />
        </div>

        <div className="crop-buttons">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={handleCropSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
