import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadInputProps {
  value?: string;
  onChange: (file: File | null) => void;
  onPreviewChange?: (preview: string | null) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
}

export default function ImageUploadInput({
  value,
  onChange,
  onPreviewChange,
  disabled = false,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
}: ImageUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Initialize preview from value prop (for existing images)
  useEffect(() => {
    if (value && !preview) {
      setPreview(value);
    }
  }, [value, preview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`Image must be smaller than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setIsLoading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreview(result);
        onPreviewChange?.(result);
      };
      reader.readAsDataURL(file);

      setFileName(file.name);
      onChange(file);
      toast.success("Image selected successfully");
    } catch (error) {
      toast.error("Failed to process image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setFileName("");
    onChange(null);
    onPreviewChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event("change", { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="image-upload" className="text-sm font-medium">
        Event Banner Image
      </Label>
      <div className="space-y-3">
        {/* Preview */}
        {preview && (
          <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-50">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className="relative"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled || isLoading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className={`w-full px-4 py-3 md:py-4 border-2 border-dashed rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin">
                  <Upload className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-sm text-slate-600">Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-slate-500">
                  PNG, JPG, GIF up to {maxSize / 1024 / 1024}MB
                </span>
              </>
            )}
          </button>
        </div>

        {/* File Info */}
        {fileName && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-slate-700 truncate">{fileName}</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-red-600 transition-colors flex-shrink-0"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-slate-500">
          Recommended size: 1200x600px. Images will be automatically optimized for web.
        </p>
      </div>
    </div>
  );
}
