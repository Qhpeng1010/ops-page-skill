export type Merchant = { id: string; name: string; shortName: string; status: 'active' | 'pending'; category: 'enterprise' | 'individual'; registeredAt: string };
const records: Merchant[] = Array.from({ length: 24 }, (_, index) => ({
  id: `DEMO${String(index + 1).padStart(4, '0')}`,
  name: `示例商户 ${index + 1}`,
  shortName: `门店 ${index + 1}`,
  status: index % 3 === 0 ? 'pending' : 'active',
  category: index % 2 === 0 ? 'enterprise' : 'individual',
  registeredAt: `2026-09-${String(index % 14 + 1).padStart(2, '0')}`,
}));
export type Query = { id?: string; name?: string; status?: Merchant['status']; registeredAt?: string };

// Local demonstration only; no backend or persistent business storage.
export async function queryMerchants(query: Query, signal: AbortSignal): Promise<Merchant[]> {
  await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 250);
    if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
  });
  return records.filter(record => record.id.toLowerCase().includes((query.id || '').trim().toLowerCase())
    && record.name.includes((query.name || '').trim())
    && (!query.status || record.status === query.status)
    && (!query.registeredAt || record.registeredAt === query.registeredAt));
}
