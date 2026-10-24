import { Badge } from '@/components/ui/badge';
import { TypeIcon } from '@/lib/project-type';
import { pct, type Project } from '@/lib/project';
import { techStyle } from '@/lib/tech';

// 목록과 상세가 같이 쓰는 조각. 감싸는 칸(small·dd·div)은 쓰는 쪽이 정한다.
export const TypeLabel = ({ type }: { type: string }) => (
  <>
    <TypeIcon type={type} />
    {type}
  </>
);

export const TechTags = ({ stack }: { stack: string[] }) => (
  <>
    {stack.map((t) => (
      <Badge key={t} variant="secondary" className="tag" style={techStyle(t)}>
        {t}
      </Badge>
    ))}
  </>
);

export const Contrib = ({ p }: { p: Pick<Project, 'contribution'> }) => (
  <>
    <span className="bar2">
      <i style={{ width: `${pct(p)}%` }} />
    </span>
    <b>{`${pct(p)}%`}</b>
  </>
);
