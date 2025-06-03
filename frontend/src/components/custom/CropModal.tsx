"use client";

import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Dialog } from "@headlessui/react";
import { getCroppedImg } from "@/lib/cropImage";
import { FaCrop, FaCheckCircle } from "react-icons/fa";

interface CropModalProps {
    image: File;
    index: number;
    total: number;
    onClose: () => void;
    onCropComplete: (croppedBlob: Blob, croppedPixels: any) => void;
    onNext: () => void;
    onFinalize: () => void;
    existingImageCount: number;
}

const CropModal: React.FC<CropModalProps> = ({
    image,
    index,
    total,
    onClose,
    onCropComplete,
    onNext,
    onFinalize,
     existingImageCount 
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [imageUrl, setImageUrl] = useState<string>("");

    useEffect(() => {
        const objectUrl = URL.createObjectURL(image);
        setImageUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [image]);

    const [isCropping, setIsCropping] = useState(false);

    const onCropCompleteHandler = useCallback((_: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleCropAndNext = async () => {
  try {
    setIsCropping(true);
    const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
    onCropComplete(croppedBlob, croppedAreaPixels); // 👈 pass both
    onNext();
  } catch (error) {
    console.error("Crop failed:", error);
  } finally {
    setIsCropping(false);
  }
};

const handleCropAndFinalize = async () => {
  try {
    setIsCropping(true);
    const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
    onCropComplete(croppedBlob, croppedAreaPixels); // 👈 pass both
    onFinalize();
  } catch (error) {
    console.error("Final crop failed:", error);
  } finally {
    setIsCropping(false);
  }
};

    return (
        <Dialog
            open={true}
            onClose={onClose}
            className="fixed z-50 inset-0 flex items-center justify-center bg-blue-400 bg-opacity-60 p-4"
        >
            <div className="bg-white p-6 w-full max-w-2xl border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] relative">
                <Dialog.Title className="font-bold text-xl mb-2">
                    Crop your Image 
                </Dialog.Title>

                <div className="relative w-full h-80 bg-gray-100 border-2 border-black mb-4">
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropCompleteHandler}
                    />
                </div>

                <div className="flex items-center justify-between gap-4 mt-2">
                    <button
                        onClick={onClose}
                        disabled={isCropping}
                        className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-semibold rounded-sm"
                    >
                        Cancel
                    </button>

                    {index < total - 1 ? (
                        <button
                            onClick={handleCropAndNext}
                            disabled={isCropping}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm"
                        >
                            <FaCrop /> Crop & Next
                        </button>
                    ) : (
                        <button
                            onClick={handleCropAndFinalize}
                            disabled={isCropping}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-green-600 hover:bg-green-700 text-white font-semibold rounded-sm"
                        >
                            <FaCheckCircle /> Finalize
                        </button>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default CropModal;