'use client';

import { useState, useRef } from 'react';
import { useOrganizations } from '@/hooks/use-organizations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImage } from '@/lib/canvas-utils';
import { UploadSimple } from '@phosphor-icons/react';

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
        if (!isOpen) {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
        setIsModalOpen(isOpen);
    };

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                1,
                width,
                height
            ),
            width,
            height
        );
        setCrop(crop);
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
        if (!completedCrop || !imageRef.current) {
            toast.error('Please crop the image before uploading.');
            return;
        }

        try {
            const croppedFile = await getCroppedImage(
                imageRef.current,
                completedCrop,
                'logo.png'
            );

            const formData = new FormData();
            formData.append('file', croppedFile);

            uploadOrganizationLogo(
                { organizationId: organization.id, formData },
                {
                    onSuccess: (data) => {
                        setPreview(data.url);
                        handleModalOpenChange(false);
                        toast.success('Logo updated successfully!');
                    },
                    onError: (error) => {
                        toast.error(error.message || 'Failed to upload logo.');
                    },
                }
            );
        } catch (e) {
            toast.error('Failed to crop image.');
            console.error(e);
        }
    };

    return (
        <div>
            <Label>Organization Logo</Label>
            <div className="flex items-center gap-4 mt-2">
                <div className="relative group">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={preview || undefined} alt={organization.name} />
                        <AvatarFallback>{organization.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadSimple size={24} className="text-white" />
                    </div>
                </div>
                <div className="grid gap-2">
                    <p className="font-medium">Update your logo</p>
                    <p className="text-xs text-muted-foreground">Click the image to upload a new one.</p>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crop your new logo</DialogTitle>
                    </DialogHeader>
                    {imageSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(pixelCrop, percentCrop) => {
                                setCrop(percentCrop);
                                setCompletedCrop(pixelCrop);
                            }}
                            aspect={1}
                            circularCrop={true}
                        >
                            <img ref={imageRef} src={imageSrc} alt="Crop preview" onLoad={onImageLoad} />
                        </ReactCrop>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleModalOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={isUploadingOrganizationLogo}>
                            {isUploadingOrganizationLogo ? 'Uploading...' : 'Save and Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 