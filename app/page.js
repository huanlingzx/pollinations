'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

// 导入 Sonner 的 toast 函数和 Toaster 组件
import { toast } from 'sonner'; // Sonner 的 toast 函数
import { Toaster } from '@/components/ui/sonner'; // Sonner 的 Toaster 组件

// 导入新组件
import { ImageGenerationForm } from '@/components/image-generation/ImageGenerationForm';
import { GeneratedImageViewer } from '@/components/image-generation/GeneratedImageViewer';
import { SavedImagesList } from '@/components/image-generation/SavedImagesList';
import { ImageDisplayDialog } from '@/components/ImageDisplayDialog';
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog';

// 导入自定义 Hook 和工具函数
import { useBlobUrlManager } from '@/hooks/useBlobUrlManager';
import { blobToBase64, downloadBlobAsFile, extractMetadataFromBlob } from '@/lib/imageUtils';


// 定义 localStorage key
const LOCAL_STORAGE_KEY = 'ai_generated_images';

export default function HomePage() {
  // 不再需要 useToast() hook，直接使用导入的 toast 函数

  // 当前生成图片的状态
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedParams, setGeneratedParams] = useState(null); // 存储本次生成的输入参数
  const [imageMetadata, setImageMetadata] = useState(null); // 存储解析出的图片元数据

  // 保存的图片列表状态
  const [savedImages, setSavedImages] = useState([]);
  const [formInitialParams, setFormInitialParams] = useState({}); // 用于导入参数到表单

  // 对话框状态
  const [selectedImageForDialog, setSelectedImageForDialog] = useState(null); // 用于放大查看图片 (当前或保存的)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false); // 控制图片放大对话框
  const [imageToDelete, setImageToDelete] = useState(null); // 待删除的图片ID
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // 控制删除确认对话框

  // Blob URL 管理器
  const { createAndStoreBlobUrl, revokeBlobUrl } = useBlobUrlManager();

  // 用于跟踪当前显示的图片URL，以便在图片更新时撤销旧的URL
  const currentImageUrlRef = useRef(null);

  useEffect(() => {
    // 当 imageUrl 变化时，如果旧的 URL 存在且不同于新的，则撤销它
    if (currentImageUrlRef.current && currentImageUrlRef.current !== imageUrl) {
      revokeBlobUrl('current_image_id'); // 撤销旧的当前图片URL
    }
    currentImageUrlRef.current = imageUrl; // 更新当前显示的图片URL
  }, [imageUrl, revokeBlobUrl]);


  // === 生命周期管理和数据加载 ===
  // 加载保存的图片
  useEffect(() => {
    const loadSavedImages = async () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedImages = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedImages) {
          try {
            const parsedImages = JSON.parse(storedImages);
            const imagesWithUrls = parsedImages.map((img) => {
              if (img.base64Image) {
                const byteString = atob(img.base64Image.split(',')[1]);
                const mimeString = img.base64Image.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                return {
                  ...img,
                  displayUrl: createAndStoreBlobUrl(blob, img.id) // 使用管理器创建和存储
                };
              }
              return img;
            });
            setSavedImages(imagesWithUrls);
          } catch (e) {
            console.error("Failed to parse saved images from localStorage", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY); // 清除损坏的数据
          }
        }
      }
    };
    loadSavedImages();
  }, [createAndStoreBlobUrl]);


  // === 核心业务逻辑 ===

  // 处理图片生成请求
  const handleGenerateImage = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setImageUrl(null); // 清除旧的图片
    setImageMetadata(null); // 清除旧的AI元数据
    setGeneratedParams(null); // 清除旧的生成参数

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP错误! 状态码: ${response.status}`);
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP错误! 状态码: ${response.status}, 消息: ${errorText.substring(0, 200)}...`);
        }
      }

      const imageBlob = await response.blob();
      const newImageUrl = createAndStoreBlobUrl(imageBlob, 'current_image_id'); // 使用管理器为当前图片分配ID并存储
      setImageUrl(newImageUrl);

      setGeneratedParams(params); // 存储本次生成的输入参数
      const metadata = await extractMetadataFromBlob(imageBlob);
      setImageMetadata(metadata);

      // 使用 sonner 的 toast.success
      toast.success("图片生成成功", {
        description: "您的图像已成功生成并显示。",
      });

    } catch (err) {
      console.error('获取图片时出错:', err);
      setError(err.message || '生成图片失败。');
      // 使用 sonner 的 toast.error
      toast.error("图片生成失败", {
        description: err.message || "生成图片时发生错误。",
      });
    } finally {
      setLoading(false);
    }
  }, [createAndStoreBlobUrl, revokeBlobUrl]);


  // 辅助函数：下载图��� (通用)
  const handleDownloadImage = useCallback(async (imgUrl, imgPrompt, format = 'jpeg') => {
    if (!imgUrl) {
      toast.error("下载失败", {
        description: "没有图片可以下载。",
      });
      return;
    }
    try {
      const response = await fetch(imgUrl);
      const imageBlob = await response.blob();

      const filename = `${imgPrompt ? imgPrompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_') : 'generated_image'}.${format}`;

      if (format === 'png') {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              downloadBlobAsFile(pngBlob, filename);
              toast.success("下载成功", {
                description: `图片已下载为 ${filename}。`,
              });
            } else {
              toast.error("下载失败", {
                description: "无法将图片转换为 PNG 格式。",
              });
            }
          }, 'image/png');
        };
        img.onerror = () => {
          toast.error("下载失败", {
            description: "无法加载图片进行 PNG 转换。",
          });
        };
        img.src = imgUrl;
      } else {
        downloadBlobAsFile(imageBlob, filename);
        toast.success("下载成功", {
          description: `图片已下载为 ${filename}。`,
        });
      }
    } catch (err) {
      console.error('下载图片失败:', err);
      toast.error("下载失败", {
        description: "下载图片时发生错误。",
      });
    }
  }, []);

  // 保存当前生成的图片
  const handleSaveImage = useCallback(async () => {
    if (!imageUrl || !generatedParams) {
      toast.error("保存失败", {
        description: "没有图片可以保存！",
      });
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const imageBlob = await response.blob();
      const base64Image = await blobToBase64(imageBlob);

      const newImageId = Date.now(); // 简单唯一ID
      const newSavedImage = {
        id: newImageId,
        base64Image: base64Image,
        generatedParams: generatedParams,
        imageMetadata: imageMetadata,
        timestamp: new Date().toISOString(),
        displayUrl: createAndStoreBlobUrl(imageBlob, newImageId) // 使用管理器为保存的图片创建URL
      };

      setSavedImages(prevImages => {
        const updatedImages = [...prevImages, newSavedImage];
        // 将不包含 displayUrl 的数据存入 localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedImages.map(img => {
          const { displayUrl, ...rest } = img; // 移除 displayUrl，因为它不能持久化
          return rest;
        })));
        return updatedImages;
      });

      toast.success("图片已保存", {
        description: "图像已成功保存到浏览器。",
      });
    } catch (e) {
      console.error('保存图片失败:', e);
      toast.error("保存失败", {
        description: "保存图片时发生错误。",
      });
    }
  }, [imageUrl, generatedParams, imageMetadata, createAndStoreBlobUrl]);

  // 导入参数到表单
  const handleImportParams = useCallback((params) => {
    setFormInitialParams(params); // 将参数传递给表单组件
    toast.info("参数已导入", { // 使用 toast.info
      description: "生成参数已导入��表单。",
    });
  }, []);

  // 删除图片
  const handleDeleteImage = useCallback((id) => {
    setImageToDelete(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteImage = useCallback(() => {
    if (imageToDelete === null) return;

    const updatedSavedImages = savedImages.filter(img => {
      if (img.id === imageToDelete) {
        revokeBlobUrl(img.id); // 释放被删除图片的 Blob URL
        return false;
      }
      return true;
    });

    setSavedImages(updatedSavedImages);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSavedImages.map(img => {
      const { displayUrl, ...rest } = img;
      return rest;
    })));

    setIsDeleteDialogOpen(false);
    setImageToDelete(null);
    toast.success("图片已删除", {
      description: "图片已从历史记录中移除。",
    });
  }, [imageToDelete, savedImages, revokeBlobUrl]);

  // 打开图片放大对话框
  const openImageDialog = useCallback((imageInfo) => {
    setSelectedImageForDialog(imageInfo);
    setIsImageDialogOpen(true);
  }, []);

  // 提示词增强（仅实现按钮，无实际功能）
  const handleEnhancePrompt = useCallback(() => {
    toast.info("功能待实现", { // 使用 toast.info
      description: "提示词增强功能将在未来版本中提供。",
    });
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 p-4 gap-4">
        {/* 左侧面板: 参数表单 */}
        <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col">
          <ImageGenerationForm
            onGenerate={handleGenerateImage}
            loading={loading}
            initialParams={formInitialParams}
            onEnhancePrompt={handleEnhancePrompt}
          />
        </div>

        {/* 右侧面板: 图片显示 & 历史记录 */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          {/* 生成图片区域 */}
          <GeneratedImageViewer
            imageUrl={imageUrl}
            loading={loading}
            error={error}
            generatedParams={generatedParams}
            imageMetadata={imageMetadata}
            onDownload={handleDownloadImage}
            onSave={handleSaveImage}
            onOpenImageDialog={openImageDialog}
          />
          {/* 保存的图片列表区域 */}
          <SavedImagesList
            savedImages={savedImages}
            onOpenImage={openImageDialog}
            onImportParams={handleImportParams}
            onDownloadImage={handleDownloadImage}
            onDeleteImage={handleDeleteImage}
          />
        </div>

        {/* 图片放大对话框 (通用) */}
        <ImageDisplayDialog
          isOpen={isImageDialogOpen}
          onOpenChange={(open) => {
            setIsImageDialogOpen(open);
            if (!open) setSelectedImageForDialog(null);
          }}
          image={selectedImageForDialog}
          onDownloadImage={handleDownloadImage}
          onImportParams={handleImportParams}
          onDeleteImage={handleDeleteImage}
        />

        {/* 删除确认对话框 */}
        <ConfirmAlertDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="确定要删除这张图片吗？"
          description="此操作无法撤销。图片将从您的浏览器存储中永久删除。"
          onConfirm={confirmDeleteImage}
          confirmText="删除"
        />
      </div>
      {/* 添加 Sonner 的 Toaster 组件，可以添加 richColors 属性以获得更丰富的颜色支持 */}
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
