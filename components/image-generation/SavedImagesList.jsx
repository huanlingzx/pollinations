// components/image-generation/SavedImagesList.jsx
import React from 'react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';

export function SavedImagesList({
  savedImages,
  onOpenImage, // 接收父组件的打开放大对话框函数
}) {
  return (
    <div className="p-6 bg-white shadow-lg rounded-lg h-[250px] flex flex-col">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ImageIcon className="h-6 w-6" />
        已保存的图片 ({savedImages.length})
      </h2>
      {savedImages.length === 0 ? (
        <p className="text-gray-500 text-center">暂无保存的图片。</p>
      ) : (
        <ScrollArea className="flex-grow w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {savedImages.slice().reverse().map((image) => (
              <Card key={image.id} className="flex flex-col">
                {/* <CardHeader className="p-2 pb-0">
                  <CardDescription className="text-xs">
                  </CardDescription>
                </CardHeader> */}
                <CardContent className="flex-grow p-1"> {/* 减小 padding */}
                  <div className="relative w-full h-24 bg-gray-200 rounded-md overflow-hidden cursor-pointer"
                       onClick={() => onOpenImage(image)}>
                    {image.displayUrl ? (
                      <Image
                        src={image.displayUrl}
                        alt={image.generatedParams?.prompt || `保存的图片 ${image.id}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        图片加载失败
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
