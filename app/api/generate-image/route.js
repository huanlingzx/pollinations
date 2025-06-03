import { NextResponse } from 'next/server';

export async function POST(request) {
  // 确保 API Token 存在
  const POLLINATIONS_API_TOKEN = process.env.POLLINATIONS_API_TOKEN;
  if (!POLLINATIONS_API_TOKEN) {
    return NextResponse.json({ error: '服务器配置错误: Pollinations API Token 未设置。' }, { status: 500 });
  }

  try {
    // 解析前端发送的请求体
    const {
      prompt,
      width,
      height,
      seed,
      model,
      nologo,
      private: privateImage, // 注意这里的重命名，以避免与 JS 关键词冲突
      enhance,
      safe,
    } = await request.json();

    // 验证 prompt 参数
    if (!prompt) {
      return NextResponse.json({ error: '提示词 (prompt) 是必填项。' }, { status: 400 });
    }

    // 准备 Pollinations API 的参数
    const params = {
      width: Number(width),
      height: Number(height),
      model: model,
    };

    // 处理种子：如果未填写，则生成一个随机数
    let finalSeed = seed;
    if (!finalSeed || isNaN(Number(finalSeed))) {
      finalSeed = Math.floor(Math.random() * 1000000000); // 确保是数字
    }
    params.seed = Number(finalSeed);

    // === 优化布尔参数：仅当为 true 时才添加 ===
    if (nologo) {
      params.nologo = true;
    }
    if (privateImage) { // 注意这里是 privateImage
      params.private = true;
    }
    if (enhance) {
      params.enhance = true;
    }
    if (safe) {
      params.safe = true;
    }
    // ===========================================

    const queryParams = new URLSearchParams(params);
    const encodedPrompt = encodeURIComponent(prompt);

    // 构建 Pollinations API 的 URL
    const externalApiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${queryParams.toString()}`;

    console.log('后端正在调用 Pollinations API:', externalApiUrl);

    // 调用 Pollinations API，并添加 Authorization Header
    const response = await fetch(externalApiUrl, {
      method: 'GET', // Pollinations API 依然是 GET 请求
      headers: {
        'Authorization': `Bearer ${POLLINATIONS_API_TOKEN}`,
        // 可以在这里添加其他必要的头，例如 User-Agent，但通常不是必需的
      },
    });

    // 处理 Pollinations API 的响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pollinations API 错误! 状态码: ${response.status}, 消息: ${errorText}`);
      return NextResponse.json(
        { error: `图片生成失败: ${errorText}` },
        { status: response.status }
      );
    }

    // 将 Pollinations API 返回的图片 Blob 直接转发给前端
    // 重要：直接返回 response.body 可以实现流式传输，避免将整个图片加载到服务器内存中
    // 同时，转发 Content-Type 等响应头，让浏览器知道这是一个图片
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Content-Length': response.headers.get('Content-Length') || '',
        // 可以根据需要转发其他头，例如 Cache-Control
      },
    });

  } catch (error) {
    console.error('后端生成图片时发生错误:', error);
    return NextResponse.json({ error: '内部服务器错误，无法生成图片。' }, { status: 500 });
  }
}
