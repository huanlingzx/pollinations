'use client'; // 这是一个客户端组件

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// 引入图标
import { Info, Download, Maximize, RefreshCcw, BookOpen, Save, Trash2, Import, Image as ImageIcon } from 'lucide-react';

// 定义 localStorage key
const LOCAL_STORAGE_KEY = 'ai_generated_images';

export default function HomePage() {
  // 表单输入状态
  const [prompt, setPrompt] = useState('一片美丽的海上日落');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [seed, setSeed] = useState('');
  const [model, setModel] = useState('flux');
  const [nologo, setNologo] = useState(false);
  const [privateImage, setPrivate] = useState(false);
  const [enhance, setEnhance] = useState(false);
  const [safe, setSafe] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('hd');

  // 图片显示状态
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageMetadata, setImageMetadata] = useState(null); // 存储解析出的图片参数 (AI返回的元数据)

  // 存储已生成图片的输入参数
  const [generatedParams, setGeneratedParams] = useState(null);

  // 保存的图片列表状态
  const [savedImages, setSavedImages] = useState([]);
  const [selectedImageForDialog, setSelectedImageForDialog] = useState(null); // 用于放大查看保存的图片
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false); // 控制图片放大对话框
  const [isParamsDialogOpen, setIsParamsDialogOpen] = useState(false); // 控制参数显示对话框
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // 控制删除确认对话框
  const [imageToDelete, setImageToDelete] = useState(null); // 待删除的图片ID

  // 用于在 URL.createObjectURL 改变时释放内存
  const prevImageUrlRef = useRef(null);

  // 用于管理 Blob URL 的引用计数和释放
  // Map<id | 'current_image_id', blobUrl>
  const blobUrlsRef = useRef(new Map());

  // === Blob URL 管理函数 ===
  const createAndStoreBlobUrl = useCallback((blob, id) => {
    const url = URL.createObjectURL(blob);
    // 释放旧的 URL 如果存在
    if (blobUrlsRef.current.has(id)) {
      URL.revokeObjectURL(blobUrlsRef.current.get(id));
    }
    blobUrlsRef.current.set(id, url);
    return url;
  }, []);

  const revokeBlobUrl = useCallback((id) => {
    if (blobUrlsRef.current.has(id)) {
      URL.revokeObjectURL(blobUrlsRef.current.get(id));
      blobUrlsRef.current.delete(id);
    }
  }, []);

  // 组件卸载时清理所有 Blob URLs
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  // === 生命周期管理和数据加载 ===
  useEffect(() => {
    // 每次 imageUrl 改变时，释放旧的 URL
    if (prevImageUrlRef.current && prevImageUrlRef.current !== imageUrl) {
      URL.revokeObjectURL(prevImageUrlRef.current);
    }
    prevImageUrlRef.current = imageUrl;
    // 组件卸载时释放最后的 URL
    return () => {
      if (prevImageUrlRef.current) {
        URL.revokeObjectURL(prevImageUrlRef.current);
      }
      // 额外释放所有保存的图片 URL，因为它们也是 createObjectURL 生成的
      savedImages.forEach(img => {
        if (img.displayUrl) {
          URL.revokeObjectURL(img.displayUrl);
        }
      });
    };
  }, [imageUrl, savedImages]); // 依赖 savedImages 确保在列表变化时也清理旧 URL

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
                // 直接从 Data URL 创建 Blob URL
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
                  displayUrl: createAndStoreBlobUrl(blob, img.id) // 使用新的管理函数
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

  // 模型列表
  // 使用 useMemo
  const availableModels = useMemo(() => [
    { value: 'flux', label: 'Flux' },
    { value: 'turbo', label: 'Turbo' },
    { value: 'gptimage', label: 'GPT Image' },
  ], []);

  // 尺寸预设
  // 使用 useMemo 记忆 dimensionPresets 对象
  const dimensionPresets = useMemo(() => ({
    square: { width: 512, height: 512, label: '方形 (512x512)' },
    hd: { width: 1024, height: 1024, label: '高清 (1024x1024)' },
    portrait3_4: { width: 768, height: 1024, label: '肖像 3:4 (768x1024)' },
    portrait9_16: { width: 576, height: 1024, label: '肖像 9:16 (576x1024)' },
    landscape4_3: { width: 1024, height: 768, label: '风景 4:3 (1024x768)' },
    landscape16_9: { width: 1024, height: 576, label: '风景 16:9 (1024x576)' },
    custom: { width: null, height: null, label: '自定义' },
  }), []); // <-- 空依赖数组表示只在组件初次渲染时计算一次

  // 根据预设更新 width 和 height
  useEffect(() => {
    if (selectedPreset !== 'custom') {
      const preset = dimensionPresets[selectedPreset];
      if (preset) {
        setWidth(preset.width);
        setHeight(preset.height);
      }
    }
  }, [selectedPreset, dimensionPresets]);

  // 生成随机种子
  const generateRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000000).toString();
    setSeed(newSeed);
  };

  // 提示词增强（仅实现按钮，无实际功能）
  const handleEnhancePrompt = () => {
    alert('提示词增强功能待实现，将通过AI接口优化当前提示词。');
    // 实际实现中，这里会调用一个AI接口来优化 prompt
    // setPrompt('AI优化后的提示词...');
  };

  // 下载图片
  const handleDownloadImage = async (format = 'jpeg') => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const imageBlob = await response.blob();

      let finalBlob = imageBlob;
      let filename = `generated_image.${format}`;

      if (format === 'png') {
        const img = new window.Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } else {
              alert('无法将图片转换为 PNG 格式。');
            }
          }, 'image/png');
        };
        img.onerror = () => {
          alert('无法加载图片进行 PNG 转换。');
        };
        img.src = imageUrl;
        return; // 异步操作，提前返回
      }

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下载图片失败:', err);
      alert('下载图片失败。');
    }
  };

  // 将 Blob 转换为 Base64 字符串
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 保存当前生成的图片
  const handleSaveImage = useCallback(async () => {
    if (!imageUrl || !generatedParams) {
      alert('没有图片可以保存！');
      return;
    }

    setLoading(true); // 暂时用 loading 状态表示保存中

    try {
      const response = await fetch(imageUrl);
      const imageBlob = await response.blob();
      const base64Image = await blobToBase64(imageBlob);

      const newImage = {
        id: Date.now(), // 简单唯一ID
        base64Image: base64Image,
        generatedParams: generatedParams,
        imageMetadata: imageMetadata,
        timestamp: new Date().toISOString(),
      };

      // 直接更新 savedImages 状态，并为其创建 displayUrl
      setSavedImages(prevImages => {
        const updatedImages = [...prevImages, { ...newImage, displayUrl: createAndStoreBlobUrl(imageBlob, newImageId) }];
        // 将不包含 displayUrl 的数据存入 localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedImages.map(img => {
          const { displayUrl, ...rest } = img; // 移除 displayUrl，因为它不能持久化
          return rest;
        })));
        return updatedImages;
      });

      alert('图片已保存到浏览器！');
    } catch (e) {
      console.error('保存图片失败:', e);
      alert('保存图片失败。');
    } finally {
      setLoading(false);
    }
  }, [imageUrl, generatedParams, imageMetadata, createAndStoreBlobUrl]);

  // 导入参数到表单
  const handleImportParams = useCallback((params) => {
    setPrompt(params.prompt || '');
    setWidth(params.width || 1024);
    setHeight(params.height || 1024);
    setSeed(params.seed ? String(params.seed) : ''); // 确保是字符串
    setModel(params.model || 'flux');
    setNologo(params.nologo || false);
    setPrivate(params.private || false);
    setEnhance(params.enhance || false);
    setSafe(params.safe || false);
    // 尝试匹配预设尺寸
    const matchedPreset = Object.keys(dimensionPresets).find(key =>
      key !== 'custom' &&
      dimensionPresets[key].width === params.width &&
      dimensionPresets[key].height === params.height
    );
    setSelectedPreset(matchedPreset || 'custom');
    alert('参数已导入到表单。');
  }, [dimensionPresets]);

  // 删除图片
  const handleDeleteImage = useCallback((id) => {
    setImageToDelete(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteImage = useCallback(() => {
    if (imageToDelete === null) return;
    const updatedSavedImages = savedImages.filter(img => img.id !== imageToDelete);
    setSavedImages(updatedSavedImages);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSavedImages.map(img => {
      const { displayUrl, ...rest } = img;
      return rest;
    })));

    // 释放被删除图片的 Blob URL
    const deletedImage = savedImages.find(img => img.id === imageToDelete);
    if (deletedImage && deletedImage.displayUrl) {
      URL.revokeObjectURL(deletedImage.displayUrl);
    }
    setIsDeleteDialogOpen(false);
    setImageToDelete(null);
  }, [imageToDelete, savedImages]);

  // 打开保存图片的放大对话框
  const openSavedImageDialog = useCallback((image) => {
    setSelectedImageForDialog(image);
    setIsImageDialogOpen(true);
  }, []);

  // 尝试从 Blob 中解析 JSON 参数
  const extractMetadataFromBlob = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 查找起始标记: b'flux\x00\x00ASCII\x00\x00\x00' (hex: 66 6c 75 78 00 00 41 53 43 49 49 00 00 00)
      const startMarker = new Uint8Array([0x00, 0x41, 0x53, 0x43, 0x49, 0x49, 0x00, 0x00, 0x00]);
      let startIndex = -1;
      for (let i = 0; i <= uint8Array.length - startMarker.length; i++) {
        let match = true;
        for (let j = 0; j < startMarker.length; j++) {
          if (uint8Array[i + j] !== startMarker[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          startIndex = i + startMarker.length;
          break;
        }
      }

      if (startIndex === -1) {
        console.warn('未找到图片中的元数据起始标记。');
        return null;
      }

      // 查找结束标记: b'\x06' (ACK) 或 b'\x00' (NUL)
      const endMarkerByte1 = 0x06; // ACK
      const endMarkerByte2 = 0x00; // NUL
      // let endIndex = -1; // 标记 JSON 字符串的实际结束位置 (不包含结束字节本身)

      // 寻找第一个 0x06 或 0x00 字节，并将其作为 JSON 数据的结束点（不包含该字节）
      let potentialJsonEndIndex = -1;
      for (let i = startIndex; i < uint8Array.length; i++) {
        if (uint8Array[i] === endMarkerByte1 || uint8Array[i] === endMarkerByte2) {
          potentialJsonEndIndex = i; // 找到结束标记字节的位置
          break;
        }
      }
      if (potentialJsonEndIndex === -1) {
        console.warn('未找到图片中的元数据结束字节 (\x06 或 \x00)。');
        return null;
      }

      // // 查找结束标记: b'}'
      // const endMarkerByte = 0x7d; // ASCII '}'
      // let endIndex = -1;
      // // 从 startIndex 开始查找
      // for (let i = startIndex; i < uint8Array.length; i++) {
      //   if (uint8Array[i] === endMarkerByte) {
      //     endIndex = i;
      //     break;
      //   }
      // }

      // if (endIndex === -1) {
      //   console.warn('未找到图片中的元数据结束标记。');
      //   return null;
      // }

      // 提取 JSON 字节数组
      // const jsonBytes = uint8Array.slice(startIndex, endIndex + 1); // +1 包含 '}'
      const jsonBytes = uint8Array.slice(startIndex, potentialJsonEndIndex); // 不包含 b'\x06' (ACK) 或 b'\x00' (NUL)
      const textDecoder = new TextDecoder('utf-8');
      const jsonString = textDecoder.decode(jsonBytes);

      try {
        const metadata = JSON.parse(jsonString);
        return metadata;
      } catch (jsonErr) {
        console.error('解析图片元数据 JSON 失败:', jsonErr);
        console.log('尝试解析的JSON字符串:', jsonString);
        return null;
      }
    } catch (err) {
      console.error('读取图片 Blob 失败:', err);
      return null;
    }
  };


  const fetchImage = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setImageUrl(null);
    setImageMetadata(null); // 清除旧的AI元数据
    setGeneratedParams(null); // 清除旧的生成参数

    try {
      // 收集当前表单的参数
      const currentParams = {
        prompt: prompt,
        width: Number(width),
        height: Number(height),
        model: model,
        nologo: nologo,
        private: privateImage,
        enhance: enhance,
        safe: safe,
      };

      // 处理种子：如果未填写，则生成一个随机数
      let finalSeed = seed;
      if (!finalSeed || isNaN(Number(finalSeed))) {
        finalSeed = Math.floor(Math.random() * 1000000000).toString();
      }
      currentParams.seed = Number(finalSeed); // 确保发送的是数字

      // const queryParams = new URLSearchParams(currentParams);
      // const encodedPrompt = encodeURIComponent(prompt);
      // const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?${queryParams.toString()}`;

      // console.log('正在从以下URL获取图片:', url);

      // const response = await fetch(url);
      // if (!response.ok) {
      //   const errorText = await response.text();
      //   throw new Error(
      //     `HTTP错误! 状态码: ${response.status}, 消息: ${errorText}`
      //   );
      // }

      // 调用我们自己的 Next.js API Route
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 注意：这里不需要 Authorization Header，因为 Token 在后端处理
        },
        body: JSON.stringify(currentParams), // 将所有参数作为 JSON 发送
      });
      if (!response.ok) {
        // 如果后端返回的不是图片，而是 JSON 错误信息
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP错误! 状态码: ${response.status}`);
        } else {
          // 如果后端返回的是非 JSON 错误信息（例如，直接转发了 Pollinations 的错误页面）
          const errorText = await response.text();
          throw new Error(`HTTP错误! 状态码: ${response.status}, 消息: ${errorText.substring(0, 200)}...`); // 截断长错误信息
        }
      }

      // 成功响应是图片 Blob
      const imageBlob = await response.blob();
      const newImageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(newImageUrl);

      // 存储本次生成的输入参数
      setGeneratedParams(currentParams);

      // 尝试解析图片中的元数据
      const metadata = await extractMetadataFromBlob(imageBlob);
      setImageMetadata(metadata);

      console.log('图片获取成功并已显示。');
    } catch (err) {
      console.error('获取图片时出错:', err);
      setError(err.message || '生成图片失败。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 p-4">
        {/* 左侧面板: 参数表单 */}
        <div className="w-full md:w-1/3 p-6 bg-white shadow-lg rounded-lg mb-4 md:mb-0 md:mr-4 overflow-y-auto max-h-[calc(100vh-2rem)]"> {/* 限制高度并允许滚动 */}
          <h1 className="text-2xl font-bold mb-6 text-center">AI 图像生成器</h1>
          <form onSubmit={fetchImage} className="space-y-4">
            {/* 提示词增强按钮 */}
            <Button
              type="button"
              onClick={handleEnhancePrompt}
              className="w-full mb-4"
              variant="outline"
            >
              提示词增强 (AI 优化)
            </Button>

            {/* 提示词 */}
            <div>
              <Label htmlFor="prompt" className="flex items-center gap-1">
                提示词 (必填)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>描述您希望AI生成的图像内容。</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                placeholder="例如：赛博朋克城市下雨的夜晚"
              />
            </div>

            {/* 尺寸选择 */}
            <div>
              <Label htmlFor="dimensionPreset" className="flex items-center gap-1">
                尺寸
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>选择预设的图像尺寸或自定义。</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex items-center space-x-2">
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger id="dimensionPreset" className="w-[180px]">
                    <SelectValue placeholder="选择尺寸" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dimensionPresets).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min="1"
                  disabled={selectedPreset !== 'custom'}
                  className="w-24"
                />
                <span className="text-xl">x</span>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min="1"
                  disabled={selectedPreset !== 'custom'}
                  className="w-24"
                />
              </div>
            </div>

            {/* 种子 */}
            <div>
              <Label htmlFor="seed" className="flex items-center gap-1">
                种子 (可选)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>用于重复生成相同结果的数字。不填将随机生成。</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="seed"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="例如：12345"
                />
                <Button type="button" onClick={generateRandomSeed} variant="outline" size="icon">
                  <RefreshCcw className="h-4 w-4" />
                  <span className="sr-only">生成随机种子</span>
                </Button>
              </div>
            </div>

            {/* 模型 */}
            <div>
              <Label htmlFor="model" className="flex items-center gap-1">
                模型
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>选择用于生成图像的AI模型。</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="选择一个模型" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 开关选项 */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="nologo" className="flex items-center gap-1 mb-2 cursor-pointer">
                  禁用 Pollinations 标志
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>设置为 true 以禁用 Pollinations 标志水印。</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  id="nologo"
                  checked={nologo}
                  onCheckedChange={setNologo}
                />
              </div>

              <div>
                <Label htmlFor="private" className="flex items-center gap-1 mb-2 cursor-pointer">
                  私有模式
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>设置为 true 以防止图像出现在公共订阅源中。</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  id="private"
                  checked={privateImage}
                  onCheckedChange={setPrivate}
                />
              </div>

              <div>
                <Label htmlFor="enhance" className="flex items-center gap-1 mb-2 cursor-pointer">
                  增强提示词
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>设置为 true 以使用 LLM 增强提示词以获取更多细节。</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  id="enhance"
                  checked={enhance}
                  onCheckedChange={setEnhance}
                />
              </div>

              <div>
                <Label htmlFor="safe" className="flex items-center gap-1 mb-2 cursor-pointer">
                  严格 NSFW 过滤
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>设置为 true 以进行严格的 NSFW 过滤（如果检测到则抛出错误）。</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  id="safe"
                  checked={safe}
                  onCheckedChange={setSafe}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !prompt}>
              {loading ? '正在生成...' : '生成图像'}
            </Button>
          </form>
        </div>

        {/* 右侧面板: 图片显示 & 历史记录 */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          {/* 生成图片区域 */}
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
                {/* 图片及其操作按钮 */}
                <div className="relative w-full flex-grow flex items-center justify-center min-h-[200px] max-h-full">
                  <Image
                    src={imageUrl}
                    alt={generatedParams?.prompt || '生成的图片'}
                    width={generatedParams?.width || width}
                    height={generatedParams?.height || height}
                    unoptimized={true}
                    className="object-contain max-w-full max-h-full rounded-md shadow-md cursor-pointer"
                    onClick={() => openSavedImageDialog({
                      displayUrl: imageUrl,
                      generatedParams: generatedParams,
                      imageMetadata: imageMetadata
                    })} // 传递当前图片信息
                  />
                  <Button
                    className="absolute top-2 right-2 p-2 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100"
                    size="icon"
                    onClick={() => openSavedImageDialog({
                      displayUrl: imageUrl,
                      generatedParams: generatedParams,
                      imageMetadata: imageMetadata
                    })}
                  >
                    <Maximize className="h-5 w-5 text-gray-700" />
                    <span className="sr-only">放大图片</span>
                  </Button>
                </div>
                {/* 下载和保存按钮 */}
                <div className="flex space-x-2 mt-4 mb-4">
                  <Button onClick={() => handleDownloadImage(imageUrl, generatedParams?.prompt, 'jpeg')}>
                    <Download className="h-4 w-4 mr-2" />
                    下载 JPG
                  </Button>
                  <Button onClick={() => handleDownloadImage(imageUrl, generatedParams?.prompt, 'png')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    下载 PNG
                  </Button>
                  <Button onClick={handleSaveImage} variant="secondary">
                    <Save className="h-4 w-4 mr-2" />
                    保存图片
                  </Button>
                </div>
                {/* 图片参数显示按钮 */}
                {generatedParams && (
                  <Dialog open={isParamsDialogOpen} onOpenChange={setIsParamsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="mt-2">
                        <BookOpen className="h-4 w-4 mr-2" />
                        查看图片参数
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>已生成图片参数</DialogTitle>
                        <DialogDescription>
                          这里显示了生成当前图片时使用的所有输入参数以及AI返回的元数据。
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="text-sm text-gray-700 space-y-2">
                          <p><strong>提示词:</strong> {generatedParams.prompt}</p>
                          <p><strong>尺寸:</strong> {generatedParams.width} x {generatedParams.height}</p>
                          <p><strong>种子:</strong> {generatedParams.seed}</p>
                          <p><strong>模型:</strong> {generatedParams.model}</p>
                          <p><strong>去除标志:</strong> {generatedParams.nologo ? '是' : '否'}</p>
                          <p><strong>私有模式:</strong> {generatedParams.private ? '是' : '否'}</p>
                          <p><strong>增强提示词:</strong> {generatedParams.enhance ? '是' : '否'}</p>
                          <p><strong>严格 NSFW 过滤:</strong> {generatedParams.safe ? '是' : '否'}</p>
                          {imageMetadata && (
                            <>
                              <h4 className="font-semibold mt-3 mb-1">AI返回元数据:</h4>
                              <pre className="whitespace-pre-wrap break-words text-xs bg-gray-100 p-2 rounded-md">
                                {JSON.stringify(imageMetadata, null, 2)}
                              </pre>
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
            {!imageUrl && !loading && !error && (
              <div className="text-lg text-gray-500 text-center">
                输入参数并点击 "生成图像" 查看结果。
              </div>
            )}
          </div>
          {/* 保存的图片列表区域 */}
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
                  {savedImages.slice().reverse().map((image) => ( // 反转显示最新保存的在前面
                    <Card key={image.id} className="flex flex-col">
                      <CardHeader className="p-2 pb-0">
                        <CardDescription className="text-xs">
                          {new Date(image.timestamp).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow p-2">
                        <div className="relative w-full h-24 bg-gray-200 rounded-md overflow-hidden cursor-pointer"
                             onClick={() => openSavedImageDialog(image)}>
                          {image.displayUrl ? (
                            <Image
                              src={image.displayUrl}
                              alt={image.generatedParams?.prompt || `保存的图片 ${image.id}`}
                              fill // 使用 fill 填充容器
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover" // 裁剪以覆盖
                              unoptimized={true}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                              图片加载失败
                            </div>
                          )}
                        </div>
                      </CardContent>
                      {/* <CardFooter className="flex flex-col gap-2 p-2 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleImportParams(image.generatedParams)}
                        >
                          <Import className="h-4 w-4 mr-2" />
                          导入参数
                        </Button>
                        <div className="flex w-full justify-between gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-grow"
                            onClick={() => handleDownloadImage(image.displayUrl, image.generatedParams?.prompt, 'jpeg')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-grow"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter> */}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        {/* 图片放大对话框 (通用，根据 selectedImageForDialog 显示) */}
        <Dialog open={isImageDialogOpen} onOpenChange={(open) => {
          setIsImageDialogOpen(open);
          if (!open) setSelectedImageForDialog(null); // 关闭时清空
        }}>
          <DialogContent className="max-w-screen-xl w-[90vw] h-[90vh] flex flex-col p-4">
            <DialogHeader>
              <DialogTitle>{selectedImageForDialog?.generatedParams?.prompt || '查看图片'}</DialogTitle>
              <DialogDescription>
                {selectedImageForDialog ? `尺寸: ${selectedImageForDialog.generatedParams?.width}x${selectedImageForDialog.generatedParams?.height}` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow flex items-center justify-center overflow-hidden">
              {selectedImageForDialog?.displayUrl && (
                <Image
                  src={selectedImageForDialog.displayUrl}
                  alt={selectedImageForDialog.generatedParams?.prompt || '放大的图片'}
                  width={selectedImageForDialog.generatedParams?.width || 1024}
                  height={selectedImageForDialog.generatedParams?.height || 1024}
                  unoptimized={true}
                  className="object-contain max-w-full max-h-full"
                />
              )}
            </div>
            {selectedImageForDialog && (
              <div className="flex justify-center gap-4 mt-4">
                <Button onClick={() => handleDownloadImage(selectedImageForDialog.displayUrl, selectedImageForDialog.generatedParams?.prompt, 'jpeg')}>
                  <Download className="h-4 w-4 mr-2" />
                  下载 JPG
                </Button>
                <Button onClick={() => handleDownloadImage(selectedImageForDialog.displayUrl, selectedImageForDialog.generatedParams?.prompt, 'png')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下载 PNG
                </Button>
                <Button onClick={() => handleImportParams(selectedImageForDialog.generatedParams)} variant="secondary">
                  <Import className="h-4 w-4 mr-2" />
                  导入参数
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* 删除确认对话框 */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确定要删除这张图片吗？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作无法撤销。图片将从您的浏览器存储中永久删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteImage}>删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
