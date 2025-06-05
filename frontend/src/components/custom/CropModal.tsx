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
            className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-400 bg-opacity-40 px-4"
        >
            <div className="bg-white w-full max-w-3xl rounded-lg p-6 shadow-lg">
                <Dialog.Title className="text-xl font-semibold text-gray-800 mb-4">
                    Crop your Image
                </Dialog.Title>

                <div className="relative w-full h-96 rounded-md bg-gray-100 overflow-hidden">
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropCompleteHandler}
                        showGrid={false}
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isCropping}
                        className="px-4 py-2 rounded-md border-2 border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    {index < total - 1 ? (
                        <button
                            onClick={handleCropAndNext}
                            disabled={isCropping}
                            className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <FaCrop className="w-4 h-4" />
                            Crop & Next
                        </button>
                    ) : (
                        <button
                            onClick={handleCropAndFinalize}
                            disabled={isCropping}
                            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            <FaCheckCircle className="w-4 h-4" />
                            Finalize
                        </button>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default CropModal;