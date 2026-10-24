import { Plus, RefreshCw, Sparkles } from 'lucide-react';

// 작업 유형 → 아이콘. 새 유형은 여기에 넣어야 빌드가 통과한다(content.config.ts).
export const TYPE_ICON = { 신규서비스: Sparkles, 리팩터링: RefreshCw, '기능 추가': Plus };
export const TYPES = Object.keys(TYPE_ICON) as [keyof typeof TYPE_ICON, ...(keyof typeof TYPE_ICON)[]];

export function TypeIcon({ type }: { type: string }) {
  const Icon = TYPE_ICON[type as keyof typeof TYPE_ICON];
  return Icon ? <Icon className="ti" size={14} strokeWidth={2} aria-hidden="true" /> : null;
}
