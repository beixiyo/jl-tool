/** 指标卡片：标签 + 等宽数值 */
export function Metric(props: MetricProps) {
  return (
    <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div class="text-xs text-slate-500">{props.label}</div>
      <div class="mt-2 break-all font-mono text-sm text-emerald-300">{props.value}</div>
    </div>
  )
}

export interface MetricProps {
  label: string
  value: string
}
