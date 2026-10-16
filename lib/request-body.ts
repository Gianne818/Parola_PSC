export class RequestBodyError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

/** Bounds bytes actually received, even without a trustworthy Content-Length. */
export async function boundedJson(request: Request, maxBytes = 65536, timeoutMs = 5000): Promise<unknown> {
  const declared = request.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) throw new RequestBodyError(413, 'payload_too_large', 'Request body exceeds the size limit.');
  if (!request.body) throw new RequestBodyError(400, 'invalid_json', 'A JSON body is required.');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestBodyError(408, 'request_timeout', 'Request body timed out. Retry with the same saved input.')), timeoutMs);
  });
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const chunk = await Promise.race([reader.read(), timeout]);
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) throw new RequestBodyError(413, 'payload_too_large', 'Request body exceeds the size limit.');
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(400, 'invalid_json', 'Invalid JSON body.');
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
