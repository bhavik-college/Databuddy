"use client";

import { useRef, useState } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, type PixelCrop } from "react-image-crop";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganizations } from "@/hooks/use-organizations";
import "react-image-crop/dist/ReactCrop.css";
import { UploadSimple } from "@phosphor-icons/react";
import { getCroppedImage } from "@/lib/canvas-utils";

interface OrganizationLogoUploaderProps {
  organization: {
    id: string;
    name: string;
    logo: string | null;
  };
}

export function OrganizationLogoUploader({ organization }: OrganizationLogoUploaderProps) {
  const { uploadOrganizationLogo, isUploadingOrganizationLogo } = useOrganizations();
  const [preview, setPreview] = useState<string | null>(organization.logo);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleModalOpenChange = (isOpen: boolean) => {
    if (!isOpen && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!isOpen) {
      setImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
    setIsModalOpen(isOpen);
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const percentCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(percentCrop);
    const pixelCrop = {
      unit: "px" as const,
      x: Math.round((percentCrop.x / 100) * width),
      y: Math.round((percentCrop.y / 100) * height),
      width: Math.round((percentCrop.width / 100) * width),
      height: Math.round((percentCrop.height / 100) * height),
    };
    setCompletedCrop(pixelCrop);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!imageSrc || !(completedCrop && imageRef.current)) {
      toast.error("Please crop the image before uploading.");
      return;
    }

    try {
      const croppedFile = await getCroppedImage(imageRef.current, completedCrop, "logo.png");

      const formData = new FormData();
      formData.append("file", croppedFile);

      uploadOrganizationLogo(
        { organizationId: organization.id, formData },
        {
          onSuccess: (data) => {
            setPreview(data.url);
            handleModalOpenChange(false);
            toast.success("Logo updated successfully!");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to upload logo.");
          },
        }
      );
    } catch (e) {
      toast.error("Failed to crop image.");
      console.error(e);
    }
  };

  return (
    <div>
      <Label>Organization Logo</Label>
      <div className="mt-2 flex items-center gap-4">
        <div className="group relative">
          <Avatar className="h-20 w-20">
            <AvatarImage alt={organization.name} src={preview || undefined} />
            <AvatarFallback>{organization.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload new organization logo"
          >
            <UploadSimple className="text-white" size={24} />
          </button>
        </div>
        <div className="grid gap-2">
          <p className="font-medium">Update your logo</p>
          <p className="text-muted-foreground text-xs">Click the image to upload a new one.</p>
          <Input
            accept="image/png, image/jpeg, image/gif"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
        </div>
      </div>

      <Dialog onOpenChange={handleModalOpenChange} open={isModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crop your new logo</DialogTitle>
          </DialogHeader>
          {imageSrc && (
            <ReactCrop
              aspect={1}
              circularCrop={true}
              crop={crop}
              onChange={(pixelCrop, percentCrop) => {
                setCrop(percentCrop);
                setCompletedCrop(pixelCrop);
              }}
            >
              <img alt="Crop preview" onLoad={onImageLoad} ref={imageRef} src={imageSrc} />
            </ReactCrop>
          )}
          <DialogFooter>
            <Button onClick={() => handleModalOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={isUploadingOrganizationLogo || !imageSrc || !completedCrop}
              onClick={handleUpload}
            >
              {isUploadingOrganizationLogo ? "Uploading..." : "Save and Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
