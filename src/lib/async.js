export function withTimeout(promise, ms = 15000, message = 'Tempo de resposta excedido.') {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
export async function retryOnce(
  task,
  { delay = 500, shouldRetry = () => typeof navigator === 'undefined' || navigator.onLine } = {},
) {
  try {
    return await task();
  } catch (error) {
    if (!shouldRetry(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return task();
  }
}
export function networkMessage(fallback = 'Não foi possível concluir.') {
  return typeof navigator === 'undefined' || navigator.onLine
    ? fallback
    : 'Sem conexão. Verifique a internet e tente novamente.';
}
