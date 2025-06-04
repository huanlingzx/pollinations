// components/image-generation/ImageGenerationForm.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { Info, RefreshCcw, Server, Globe } from 'lucide-react';

// 定义模型列表
const availableModels = [
  { value: 'flux', label: 'Flux' },
  { value: 'turbo', label: 'Turbo' },
  { value: 'gptimage', label: 'GPT Image' },
];

// 定义尺寸预设
const dimensionPresets = {
  square: { width: 512, height: 512, label: '方形 (512x512)' },
  hd: { width: 1024, height: 1024, label: '高清 (1024x1024)' },
  portrait3_4: { width: 768, height: 1024, label: '肖像 3:4 (768x1024)' },
  portrait9_16: { width: 576, height: 1024, label: '肖像 9:16 (576x1024)' },
  landscape4_3: { width: 1024, height: 768, label: '风景 4:3 (1024x768)' },
  landscape16_9: { width: 1024, height: 576, label: '风景 16:9 (1024x576)' },
  custom: { width: null, height: null, label: '自定义' },
};

// 风格类型
const styleKeywords = [
  { english: 'photorealistic', chinese: '照片级写实风格' },
  { english: 'hyperrealist', chinese: '超写实主义' },
  { english: 'painting style', chinese: '油画' },
  { english: 'digital painting style', chinese: '数字绘画' },
  { english: 'concept art', chinese: '概念艺术' },
  { english: 'sketch', chinese: '素描' },
  { english: 'Ink drawing', chinese: '墨水画' },
  { english: 'Charcoal drawing', chinese: '炭笔画' },
  { english: 'Cartoon', chinese: '卡通' },
  // ... 更多
];
// 创作者风格
const artistKeywords = [
  { english: 'by greg rutkowski', chinese: 'Greg Rutkowski 作品风格' },
  { english: 'by christopher nolan', chinese: 'Christopher Nolan 风格' },
  { english: 'by artgerm', chinese: 'Artgerm 风格' },
  // ... 更多
];
// 技术参数
const technicalKeywords = [
  { english: 'octane render', chinese: 'Octane 渲染引擎' },
  { english: '3D render', chinese: '3D 渲染' },
  { english: 'wide lens', chinese: '广角镜头' },
  { english: '8k', chinese: '8K 分辨率' },
  { english: 'masterpiece', chinese: '杰作' },
  { english: 'ultra detailed', chinese: '超细节' },
  { english: 'award-winning', chinese: '获奖作品' },
  { english: 'trending on ArtStation', chinese: 'ArtStation 热门' },
  { english: 'trending on CGSociety', chinese: 'CGSociety 热门' },
  // ... 更多技术参数
];
// 光线效果
const lightingKeywords = [
  { english: 'cinematic lighting', chinese: '电影级灯光' },
  { english: 'natural light', chinese: '自然光线' },
  { english: 'film grain', chinese: '胶片颗粒感' },
  { english: 'volumetric lighting', chinese: '体积光' },
  { english: 'golden hour', chinese: '黄金时段' },
  { english: 'moody lighting', chinese: '情绪化灯光' },
  // ... 更多光线效果
];
const compositionKeywords = [
  { english: 'Wide Shot', chinese: '远景' },
  { english: 'Long Shot', chinese: '长镜头' },
  { english: 'Full Shot', chinese: '全景' },
  { english: 'Medium Shot', chinese: '中景' },
  { english: 'Cowboy Shot', chinese: '牛仔镜头' },
  { english: 'Medium Close-Up', chinese: '中近景' },
  { english: 'Close-Up', chinese: '特写' },
  { english: 'Extreme Close-Up', chinese: '大特写' },
  { english: 'Two-Shot', chinese: '双人镜头' },
  { english: 'Over-the-Shoulder Shot', chinese: '过肩镜头' },
  { english: 'Point-of-View Shot (POV)', chinese: '主观视角镜头' },
  { english: 'Reaction Shot', chinese: '反应镜头' },
  { english: 'Insert Shot', chinese: '插入镜头' },
  { english: 'Cutaway Shot', chinese: '切出镜头' },
  { english: 'Low Angle Shot', chinese: '低角度镜头' },
  { english: 'High Angle Shot', chinese: '高角度镜头' },
  { english: 'Dutch Angle/Tilted Shot', chinese: '荷兰角/倾斜镜头' },
  { english: 'Aerial Shot', chinese: '航拍镜头' },
  { english: 'Tracking Shot', chinese: '跟拍镜头' },
  { english: 'Dolly Shot', chinese: '轨道镜头' },
  { english: 'Steadicam Shot', chinese: '斯坦尼康镜头' },
  { english: 'Crane Shot', chinese: '升降镜头' },
  { english: 'Handheld Shot', chinese: '手持镜头' },
  { english: 'Whip Pan Shot', chinese: '快速摇摄镜头' },
  { english: 'Zoom Shot', chinese: '变焦镜头' },
  { english: 'Rack Focus Shot', chinese: '焦点转移镜头' },
  { english: 'Split Screen Shot', chinese: '分屏镜头' },
  { english: 'Freeze Frame Shot', chinese: '定格镜头' },
  { english: 'Slow Motion Shot', chinese: '慢动作镜头' },
  { english: 'Fast Motion Shot', chinese: '快动作镜头' },
  { english: 'Montage Shot', chinese: '蒙太奇镜头' },
  { english: 'Cross-Cutting Shot', chinese: '交叉剪辑镜头' },
  { english: 'Bird\'s Eye View Shot', chinese: '鸟瞰镜头' },
  { english: 'Worm\'s Eye View Shot', chinese: '虫眼镜头' },
  { english: 'Reverse Shot', chinese: '反打镜头' },
  { english: 'Panning Shot', chinese: '横摇镜头' },
  { english: 'Tilt Shot', chinese: '俯仰镜头' },
  { english: 'Follow Shot', chinese: '跟随镜头' },
  { english: 'Static Shot', chinese: '固定镜头' },
  { english: 'Establishing Drone Shot', chinese: '无人机定场镜头' },
  { english: 'Underwater Shot', chinese: '水下镜头' },
  { english: 'POV Drone Shot', chinese: '无人机主观镜头' },
  { english: 'Crash Zoom Shot', chinese: '急推变焦镜头' },
  { english: 'Snorricam Shot', chinese: '斯诺里康镜头' },
  { english: 'Tracking POV Shot', chinese: '跟拍主观镜头' },
  { english: 'Vertigo Shot (Dolly Zoom)', chinese: '眩晕镜头（轨道变焦）' },
  { english: 'Flashback Shot', chinese: '闪回镜头' },
  { english: 'Flashforward Shot', chinese: '闪前镜头' },
  { english: 'Static Long Take Shot', chinese: '固定长镜头' },
];

export function ImageGenerationForm({ onGenerate, loading, initialParams = {}, onEnhancePrompt }) {
  const [prompt, setPrompt] = useState(initialParams.prompt || '');
  const [width, setWidth] = useState(initialParams.width || 576);
  const [height, setHeight] = useState(initialParams.height || 1024);
  const [seed, setSeed] = useState(initialParams.seed ? String(initialParams.seed) : '');
  const [model, setModel] = useState(initialParams.model || 'flux');
  const [nologo, setNologo] = useState(initialParams.nologo || false);
  const [privateImage, setPrivate] = useState(initialParams.private || false);
  const [enhance, setEnhance] = useState(initialParams.enhance || false);
  const [safe, setSafe] = useState(initialParams.safe || false);
  const [selectedPreset, setSelectedPreset] = useState(() => {
    // 根据 initialParams 尝试匹配预设尺寸
    const matchedPreset = Object.keys(dimensionPresets).find(key =>
      key !== 'custom' &&
      dimensionPresets[key].width === initialParams.width &&
      dimensionPresets[key].height === initialParams.height
    );
    return matchedPreset || 'portrait9_16'; // 默认高清或自定义
  });

  // API 调用方式状态
  const [useBackendApi, setUseBackendApi] = useState(false); // 默认使用后端API

  // 当 initialParams 改变时更新表单状态
  useEffect(() => {
    if (initialParams && Object.keys(initialParams).length > 0) {
      setPrompt(initialParams.prompt || '');
      setWidth(initialParams.width || 576);
      setHeight(initialParams.height || 1024);
      setSeed(initialParams.seed ? String(initialParams.seed) : '');
      setModel(initialParams.model || 'flux');
      setNologo(initialParams.nologo || false);
      setPrivate(initialParams.private || false);
      setEnhance(initialParams.enhance || false);
      setSafe(initialParams.safe || false);

      const matchedPreset = Object.keys(dimensionPresets).find(key =>
        key !== 'custom' &&
        dimensionPresets[key].width === initialParams.width &&
        dimensionPresets[key].height === initialParams.height
      );
      setSelectedPreset(matchedPreset || 'custom');
    }
  }, [initialParams]); // 监听 initialParams 的变化

  // 根据预设更新 width 和 height
  useEffect(() => {
    if (selectedPreset !== 'custom') {
      const preset = dimensionPresets[selectedPreset];
      if (preset) {
        setWidth(preset.width);
        setHeight(preset.height);
      }
    }
  }, [selectedPreset]);

  const generateRandomSeed = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 1000000000).toString();
    setSeed(newSeed);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    let finalSeed = seed;
    if (!finalSeed || isNaN(Number(finalSeed))) {
      finalSeed = Math.floor(Math.random() * 1000000000).toString();
    }

    const params = {
      prompt,
      width: Number(width),
      height: Number(height),
      seed: Number(finalSeed), // 确保发送的是数字
      model,
      nologo,
      private: privateImage,
      enhance,
      safe,
    };
    onGenerate(params, useBackendApi);
  }, [prompt, width, height, seed, model, nologo, privateImage, enhance, safe, useBackendApi, onGenerate]);

  // === 关键词点击处理函数 (直接追加) ===
  const handlePromptTagClick = useCallback((keyword) => {
    setPrompt(prevPrompt => {
      // 如果当前提示词为空，直接返回关键词
      if (prevPrompt.trim() === '') {
        return keyword;
      }
      // 否则，在现有提示词后添加逗号、空格和关键词
      return prevPrompt.trim() + ', ' + keyword;
    });
  }, []);

  return (
    <TooltipProvider>
      <div className="w-full p-6 bg-white shadow-lg rounded-lg h-full flex-grow flex flex-col mb-4 md:mb-0 md:mr-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">AI 图像生成器</h1>
        <form onSubmit={handleSubmit} className="space-y-4 flex-grow">
          {/* API 调用方式切换 */}
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="api-mode" className="flex items-center gap-2 text-sm font-medium">
              {useBackendApi ? <Server className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              API 调用方式: {useBackendApi ? '后端代理' : '前端直连'}
            </Label>
            <Switch
              id="api-mode"
              checked={useBackendApi}
              onCheckedChange={setUseBackendApi}
            />
          </div>

          <Button
            type="button"
            onClick={onEnhancePrompt} // 回调父组件的提示词增强逻辑
            className="w-full mb-4"
            variant="outline"
          >
            提示词增强 (AI 优化)
          </Button>

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
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              // placeholder="赛博朋克城市下雨的夜晚，霓虹灯闪烁，高楼林立，雨水倒映着光芒，街道上行人撑伞穿梭，远处有飞行的汽车，画面充满未来感和科技感，同时带有赛博朋克特有的阴郁氛围。"
              rows={5}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !prompt}>
            {loading ? '正在生成...' : '生成图像'}
          </Button>

          {/* 关键词选择区 */}
          <div className="space-y-4 p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">提示词辅助 (点击添加)</h3>
            <Tabs defaultValue="style">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="style">风格</TabsTrigger>
                <TabsTrigger value="artist">创作者</TabsTrigger>
                <TabsTrigger value="tech">技术</TabsTrigger>
                <TabsTrigger value="lighting">光线</TabsTrigger>
                <TabsTrigger value="composition">构图</TabsTrigger>
              </TabsList>
              <TabsContent value="style" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {styleKeywords.map((kw) => (
                    <Badge
                      key={kw.english}
                      // 关键词点击后不再改变颜色，因为是追加行为，不维护选中状态
                      variant="outline"
                      className="cursor-pointer px-3 py-1"
                      onClick={() => handlePromptTagClick(kw.english)}
                    >
                      {kw.chinese}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="artist" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {artistKeywords.map((kw) => (
                    <Badge
                      key={kw.english}
                      variant="outline"
                      className="cursor-pointer px-3 py-1"
                      onClick={() => handlePromptTagClick(kw.english)}
                    >
                      {kw.chinese}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="tech" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {technicalKeywords.map((kw) => (
                    <Badge
                      key={kw.english}
                      variant="outline"
                      className="cursor-pointer px-3 py-1"
                      onClick={() => handlePromptTagClick(kw.english)}
                    >
                      {kw.chinese}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="lighting" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {lightingKeywords.map((kw) => (
                    <Badge
                      key={kw.english}
                      variant="outline"
                      className="cursor-pointer px-3 py-1"
                      onClick={() => handlePromptTagClick(kw.english)}
                    >
                      {kw.chinese}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="composition" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {compositionKeywords.map((kw) => (
                    <Badge
                      key={kw.english}
                      variant="outline"
                      className="cursor-pointer px-3 py-1"
                      onClick={() => handlePromptTagClick(kw.english)}
                    >
                      {kw.chinese}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

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

        </form>
      </div>
    </TooltipProvider>
  );
}
