import { NextResponse } from 'next/server';

export const maxDuration = 60; // 设置最大持续时间为 60 秒

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
    const fetchStartTime = Date.now(); // 记录 fetch 开始时间

    // 调用 Pollinations API，并添加 Authorization Header
    const response = await fetch(externalApiUrl, {
      method: 'GET', // Pollinations API 依然是 GET 请求
      headers: {
        'Authorization': `Bearer ${POLLINATIONS_API_TOKEN}`,
        // IMPORTANT: Add a client-side timeout to the fetch request
        // This helps prevent hanging connections and provides a more specific error
        signal: AbortSignal.timeout(58 * 1000) // 例如，在 55 秒后强制超时
                                            // 留一点余量给 Vercel 函数的 60 秒最大执行时间
      },
    });

    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`[${new Date().toISOString()}] Pollinations API fetch completed in ${fetchDuration / 1000} seconds.`);

    // 处理 Pollinations API 的响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pollinations API 错误! 状态码: ${response.status}, 消息: ${errorText}`);
      return NextResponse.json(
        { error: `图片生成失败: ${errorText}` },
        { status: response.status }
      );
    }


    // 检查 Content-Type 是否是图片
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('image/')) {
        const unexpectedBody = await response.text(); // 尝试读取非图片内容
        console.error(`[${new Date().toISOString()}] Pollinations API did not return an image. Content-Type: ${contentType}, Body: ${unexpectedBody.substring(0, 200)}...`);
        return NextResponse.json({
            error: '外部 API 未返回图片格式数据。',
            receivedContentType: contentType,
            unexpectedBody: unexpectedBody.substring(0, 200) + '...' // 限制日志输出长度
        }, { status: 500 });
    }

    // 成功获取图片流，直接转发
    console.log(`[${new Date().toISOString()}] Successfully streaming image from Pollinations API with Content-Type: ${contentType}`);
    return new NextResponse(response.body, {
      status: 200, // 确保返回 200 OK
      headers: {
        'Content-Type': contentType,
        // Content-Length 可能会导致问题，如果实际传输的长度与声明不符。
        // 如果 Pollinations API 的 Content-Length 准确，可以转发。否则，不转发可能更安全，让浏览器自行处理流。
        // 'Content-Length': response.headers.get('Content-Length') || undefined,
        'Cache-Control': 'public, max-age=3600, immutable', // 建议添加缓存头
      },
    });
  } catch (error) {
    // 捕获各种可能发生的错误，例如网络错误、AbortError 等
    console.error(`[${new Date().toISOString()}] An unexpected error occurred in image generation backend:`, error);
    let errorMessage = '内部服务器错误，无法生成图片。';
    let statusCode = 500;
    if (error.name === 'AbortError') {
      errorMessage = '图片生成请求超时，请稍后再试。';
      statusCode = 504; // Gateway Timeout
    } else if (error instanceof TypeError && error.message.includes('fetch failed')) {
      // 常见于网络连接问题或DNS解析失败
      errorMessage = '网络连接问题或外部 API 不可达，请检查网络或稍后再试。';
      statusCode = 503; // Service Unavailable
    }
    // 可以根据需要添加更多错误类型判断
    return NextResponse.json({
      error: errorMessage,
      details: error.message,
      // 在开发环境可以暴露堆栈信息，生产环境不建议
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: statusCode });
  }



  //   // 将 Pollinations API 返回的图片 Blob 直接转发给前端
  //   // 重要：直接返回 response.body 可以实现流式传输，避免将整个图片加载到服务器内存中
  //   // 同时，转发 Content-Type 等响应头，让浏览器知道这是一个图片
  //   return new NextResponse(response.body, {
  //     headers: {
  //       'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
  //       'Content-Length': response.headers.get('Content-Length') || '',
  //       // 可以根据需要转发其他头，例如 Cache-Control
  //     },
  //   });

  // } catch (error) {
  //   console.error('后端生成图片时发生错误:', error);
  //   return NextResponse.json({ error: '内部服务器错误，无法生成图片。' }, { status: 500 });
  // }
}
