// lib/imageUtils.js

/**
 * 将 Blob 对象转换为 Base64 字符串 (Data URL)。
 * @param {Blob} blob - 图片 Blob 对象。
 * @returns {Promise<string>} - Base64 字符串。
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 将 Blob 对象下载为文件。
 * @param {Blob} blob - 要下载的 Blob 对象。
 * @param {string} filename - 下载文件的名称。
 */
export const downloadBlobAsFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // 立即释放 URL
};

/**
 * 从 Pollinations AI 返回的图片 Blob 中提取元数据。
 * Pollinations AI 的图片可能在 JPEG 文件的末尾嵌入一个特殊的 ASCII 字符串作为元数据。
 * 格式通常是：一些二进制数据 + `flux\x00\x00ASCII\x00\x00\x00` + JSON 字符串 + `\x06` 或 `\x00`
 * @param {Blob} blob - 图片 Blob 对象。
 * @returns {Promise<Object|null>} - 解析出的元数据对象或 null。
 */
export const extractMetadataFromBlob = async (blob) => {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 查找起始标记: b'flux\x00\x00ASCII\x00\x00\x00' (hex: 66 6c 75 78 00 00 41 53 43 49 49 00 00 00)
    const startMarker = new Uint8Array([0x66, 0x6c, 0x75, 0x78, 0x00, 0x00, 0x41, 0x53, 0x43, 0x49, 0x49, 0x00, 0x00, 0x00]);
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
    let potentialJsonEndIndex = -1;
    for (let i = startIndex; i < uint8Array.length; i++) {
      if (uint8Array[i] === endMarkerByte1 || uint8Array[i] === endMarkerByte2) {
        potentialJsonEndIndex = i;
        break;
      }
    }
    if (potentialJsonEndIndex === -1) {
      console.warn('未找到图片中的元数据结束字节 (\\x06 或 \\x00)。');
      return null;
    }

    const jsonBytes = uint8Array.slice(startIndex, potentialJsonEndIndex);
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
