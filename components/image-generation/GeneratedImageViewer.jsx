// components/image-generation/GeneratedImageViewer.jsx
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Maximize, BookOpen, Save } from 'lucide-react';
import { ImageParamsDialog } from '@/components/ImageParamsDialog'; // 导入新组件

export function GeneratedImageViewer({
  imageUrl,
  loading,
  error,
  generatedParams,
  imageMetadata,
  onDownload, // 接收父组件的下载函数
  onSave,     // 接收父组件的保存函数
  onOpenImageDialog, // 接收父组件的打开放大对话框函数
}) {
  const [isParamsDialogOpen, setIsParamsDialogOpen] = useState(false); // 控制参数显示对话框

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg flex flex-col items-center justify-center h-[calc(100vh-2rem-250px)] min-h-[300px] relative">
      {loading && (
        <div className="text-lg text-gray-600 flex flex-col items-center">
          <span className="animate-spin text-4xl">⚙️</span>
          <p className="mt-2">正在生成图片... 请稍候。</p>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-center">
          <p>错误: {error}</p>
          <p>请尝试使用不同的参数。</p>
        </div>
      )}
      {imageUrl && !loading && !error && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="relative w-full flex-grow flex items-center justify-center min-h-[200px] max-h-full">
            <Image
              src={imageUrl}
              alt={generatedParams?.prompt || '生成的图片'}
              width={generatedParams?.width || 1024}
              height={generatedParams?.height || 1024}
              unoptimized={true}
              className="object-contain max-w-full max-h-full rounded-md shadow-md cursor-pointer"
              onClick={() => onOpenImageDialog({
                displayUrl: imageUrl,
                generatedParams: generatedParams,
                imageMetadata: imageMetadata
              })}
            />
            <Button
              className="absolute top-2 right-2 p-2 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100"
              size="icon"
              onClick={() => onOpenImageDialog({
                displayUrl: imageUrl,
                generatedParams: generatedParams,
                imageMetadata: imageMetadata
              })}
            >
              <Maximize className="h-5 w-5 text-gray-700" />
              <span className="sr-only">放大图片</span>
            </Button>
          </div>
          <div className="flex space-x-2 mt-4 mb-4">
            <Button onClick={() => onDownload(imageUrl, generatedParams?.prompt, 'jpeg')}>
              <Download className="h-4 w-4 mr-2" />
              下载 JPG
            </Button>
            <Button onClick={() => onDownload(imageUrl, generatedParams?.prompt, 'png')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              下载 PNG
            </Button>
            <Button onClick={onSave} variant="secondary">
              <Save className="h-4 w-4 mr-2" />
              保存图片
            </Button>
          </div>
          {generatedParams && (
            <ImageParamsDialog
              isOpen={isParamsDialogOpen}
              onOpenChange={setIsParamsDialogOpen}
              params={generatedParams}
              metadata={imageMetadata}
            />
          )}
          {generatedParams && (
            <Button variant="secondary" className="mt-2" onClick={() => setIsParamsDialogOpen(true)}>
              <BookOpen className="h-4 w-4 mr-2" />
              查看图片参数
            </Button>
          )}
        </div>
      )}
      {!imageUrl && !loading && !error && (
        <div className="text-lg text-gray-500 text-center">
          输入参数并点击 "生成图像" 查看结果。
        </div>
      )}
    </div>
  );
}
