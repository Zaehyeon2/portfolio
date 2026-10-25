// 기술 태그 → 묶음(profile.json skills 와 같은 이름). 새 태그는 여기에 넣어야 빌드가 통과한다.
const GROUPS = {
  Backend: ['TypeScript', 'Nest.js', 'Java', 'Spring Boot', 'AWS SQS', 'Kafka', 'Go', 'MSA', 'Library', 'CLI'],
  Data: ['MySQL', 'DynamoDB', 'OpenSearch', 'Redis', 'Supabase'],
  Infra: ['AWS Lambda', 'ECS', 'S3', 'AWS CDK', 'CDKTF', 'Pulumi', 'Kubernetes', 'Serverless', 'CloudFront', 'HMS', 'Keycloak'],
  AI: ['Python', 'MCP', 'AI', 'n8n', 'Chatbot', 'Embedding', 'Automation'],
  Frontend: ['React', 'Next.js', 'Electron', 'Vite', 'Tailwind CSS', 'Zustand', 'Radix UI'],
  Blockchain: ['Solidity', 'ERC-1155', 'ERC-4337', 'IPFS'],
};
// 타임라인 팀 색(hue 195·150·35)과 겹치지 않는 hue. 글자 대비 5:1 이상.
const HUE: Record<keyof typeof GROUPS, number> = { Backend: 228, Data: 262, Infra: 292, AI: 330, Frontend: 0, Blockchain: 95 };

const groupOf = new Map(Object.entries(GROUPS).flatMap(([g, tags]) => tags.map((t) => [t, g as keyof typeof GROUPS])));
export const hasTechGroup = (t: string) => groupOf.has(t);
export const techStyle = (t: string) => {
  const g = groupOf.get(t);
  return g ? { background: `hsl(${HUE[g]} 60% 93%)`, color: `hsl(${HUE[g]} 55% 27%)` } : undefined;
};
