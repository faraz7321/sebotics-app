import {
  AutoxingEnvelope,
  AutoxingListPayload,
  getAutoxingItems,
  replaceAutoxingItems,
} from '../types/autoxing-api.types';

export function normalizeIdentifier(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function filterEnvelopeByIds<
  TItem extends Record<string, unknown>,
  TData extends AutoxingListPayload<TItem>,
>(
  envelope: AutoxingEnvelope<TData>,
  allowedIds: Set<string>,
  getItemId: (item: TItem) => string | null,
): AutoxingEnvelope<TData> {
  if (!envelope.data) {
    return envelope;
  }

  const filteredItems = getAutoxingItems(envelope.data).filter((item) => {
    const id = getItemId(item);
    return id !== null && allowedIds.has(id);
  });

  const clonedData = deepClone(envelope.data);
  replaceAutoxingItems(clonedData, filteredItems);

  return {
    ...envelope,
    data: clonedData,
  };
}
