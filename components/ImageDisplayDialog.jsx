// components/ImageDisplayDialog.jsx
import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Import, Trash2 } from 'lucide-react'; // 导入 Trash2

export function ImageDisplayDialog({ isOpen, onOpenChange, image, onDownloadImage, onImportParams, onDeleteImage }) {
  if (!image) return null;

  // 判断是否为保存的图片 (保存的图片会有 id)
  const isSavedImage = image.id !== undefined && image.id !== 'current_image_id';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-[90vw] h-[90vh] flex flex-col p-4">
        <DialogHeader>
          {/* 修改标题为通用标题 */}
          <DialogTitle>图片详情</DialogTitle>
          <DialogDescription>
            {/* {image.generatedParams?.prompt && `提示词: ${image.generatedParams.prompt}`} */}
            {image.generatedParams && ` | 尺寸: ${image.generatedParams.width}x${image.generatedParams.height}`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center overflow-hidden">
          {image.displayUrl && (
            <Image
              src={image.displayUrl}
              alt={image.generatedParams?.prompt || '放大的图片'}
              width={image.generatedParams?.width || 1024}
              height={image.generatedParams?.height || 1024}
              unoptimized={true}
              className="object-contain max-w-full max-h-full"
            />
          )}
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button onClick={() => onDownloadImage(image.displayUrl, image.generatedParams?.prompt, 'jpeg')}>
            <Download className="h-4 w-4 mr-2" />
            下载 JPG
          </Button>
          <Button onClick={() => onDownloadImage(image.displayUrl, image.generatedParams?.prompt, 'png')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            下载 PNG
          </Button>
          <Button onClick={() => onImportParams(image.generatedParams)} variant="secondary">
            <Import className="h-4 w-4 mr-2" />
            导入参数
          </Button>
          {isSavedImage && ( // 仅当是保存的图片时显示删除按钮
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false); // 关闭当前对话框
                onDeleteImage(image.id); // 触发删除操作
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
