import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DesignReference } from '@/types/designReference'
import { ReferenceManager } from './ReferenceManager'

export default async function AdminReferencesPage() {
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('design_references')
    .select('*')
    .order('created_at', { ascending: false })
  const references = (data ?? []) as DesignReference[]

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-xl font-bold text-slate-900">参考サイト管理</h1>
      <p className="mb-8 text-sm text-slate-500">
        ログイン中: {admin.email}
      </p>
      <ReferenceManager initialReferences={references} />
    </main>
  )
}
