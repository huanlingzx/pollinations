// components/ImageParamsDialog.jsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen } from 'lucide-react';

export function ImageParamsDialog({ isOpen, onOpenChange, params, metadata }) {
  if (!params) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>已生成图片参数</DialogTitle>
          <DialogDescription>
            这里显示了生成当前图片时使用的所有输入参数以及AI返回的元数据。
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>提示词:</strong> {params.prompt}</p>
            <p><strong>尺寸:</strong> {params.width} x {params.height}</p>
            <p><strong>种子:</strong> {params.seed}</p>
            <p><strong>模型:</strong> {params.model}</p>
            <p><strong>去除标志:</strong> {params.nologo ? '是' : '否'}</p>
            <p><strong>私有模式:</strong> {params.private ? '是' : '否'}</p>
            <p><strong>增强提示词:</strong> {params.enhance ? '是' : '否'}</p>
            <p><strong>严格 NSFW 过滤:</strong> {params.safe ? '是' : '否'}</p>
            {metadata && (
              <>
                <h4 className="font-semibold mt-3 mb-1">AI返回元数据:</h4>
                <pre className="whitespace-pre-wrap break-words text-xs bg-gray-100 p-2 rounded-md">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
