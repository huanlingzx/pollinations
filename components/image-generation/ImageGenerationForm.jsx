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

export function ImageGenerationForm({ onGenerate, loading, initialParams = {}, onEnhancePrompt }) {
  const [prompt, setPrompt] = useState(initialParams.prompt || '一片美丽的海上日落');
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
              placeholder="赛博朋克城市下雨的夜晚，霓虹灯闪烁，高楼林立，雨水倒映着光芒，街道上行人撑伞穿梭，远处有飞行的汽车，画面充满未来感和科技感，同时带有赛博朋克特有的阴郁氛围。"
              rows={5}
            />
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

          <Button type="submit" className="w-full" disabled={loading || !prompt}>
            {loading ? '正在生成...' : '生成图像'}
          </Button>
        </form>
      </div>
    </TooltipProvider>
  );
}
