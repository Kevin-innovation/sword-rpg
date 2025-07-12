// API 요청 유틸리티 함수들
interface FetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 10000,
    ...fetchOptions
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 성공적인 응답이면 반환
      if (response.ok) {
        return response;
      }

      // 4xx 오류는 재시도하지 않음 (클라이언트 오류)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }

      // 5xx 오류는 재시도 (서버 오류)
      if (attempt < maxRetries) {
        console.warn(`Attempt ${attempt + 1} failed with ${response.status}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      throw new Error(`Server error: ${response.status} ${response.statusText}`);

    } catch (error) {
      // AbortError나 네트워크 오류는 재시도
      if (attempt < maxRetries && (
        error.name === 'AbortError' ||
        error.message.includes('fetch') ||
        error.message.includes('network')
      )) {
        console.warn(`Attempt ${attempt + 1} failed with ${error.message}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

export async function apiRequest<T = any>(
  url: string,
  options: Omit<FetchOptions, 'body'> & { body?: any } = {}
): Promise<T> {
  const { body, ...fetchOptions } = options;

  const response = await fetchWithRetry(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}