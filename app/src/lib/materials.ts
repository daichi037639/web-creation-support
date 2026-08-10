import type { MaterialImage, MaterialKind } from '@/types/wizard'

export const MAX_MATERIALS = 10

export const MATERIAL_KIND_LABELS: Record<MaterialKind, string> = {
  product: '商品',
  exterior: '外観',
  interior: '店内',
  people: '人物',
  logo: 'ロゴ',
  other: 'その他',
}

/** 旧データに型外の値が入っていても「その他」として扱う */
export function materialKindLabel(kind: string): string {
  return MATERIAL_KIND_LABELS[kind as MaterialKind] ?? MATERIAL_KIND_LABELS.other
}

/** 生成プロンプトへ渡す素材一覧セクション。素材ゼロなら空文字（従来の生成挙動を変えない） */
export function buildMaterialsPromptText(materials: MaterialImage[]): string {
  if (materials.length === 0) return ''
  const lines = materials.map(
    (m) => `- [${materialKindLabel(m.kind)}] ${m.caption.trim() || '写真'}: ${m.url}`,
  )
  return `\n\n用意された実際の写真素材:\n${lines.join('\n')}`
}

/** 追加後に上限を超えないか */
export function canAddMaterials(currentCount: number, addingCount: number): boolean {
  return currentCount + addingCount <= MAX_MATERIALS
}
