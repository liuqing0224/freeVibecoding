<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton/index.vue'
import DocumentField from '../components/DocumentField.vue'
import MarkdownPreview from '../components/MarkdownPreview.vue'
import { useWorkspaceStore } from '../store'
import type { DocumentField as FieldDefinition, DocumentType } from '../types'

type EditMode = 'markdown' | 'structured'
const route = useRoute(); const router = useRouter(); const store = useWorkspaceStore()
const content = reactive<Record<string, unknown>>({}); const markdown = ref(''); const mode = ref<EditMode>('markdown')
const saving = ref(false); const saved = ref(true); const error = ref(''); const syncing = ref(false)
let timer: number | undefined; let pendingKind: EditMode = 'markdown'
const projectId = computed(() => String(route.params.id)); const activeType = computed(() => String(route.params.type || 'prd') as DocumentType)
const definition = computed(() => store.bootstrap?.documentDefinitions.find((item) => item.type === activeType.value))
const document = computed(() => store.documents.find((item) => item.type === activeType.value))
const fieldGroups = computed(() => {
  const groups = new Map<string, FieldDefinition[]>()
  for (const field of definition.value?.fields ?? []) groups.set(field.group ?? '', [...(groups.get(field.group ?? '') ?? []), field])
  return [...groups].map(([name, fields]) => ({ name, fields, complete: groupComplete(fields) }))
})

function scalarPresent(value: unknown) { if (typeof value === 'string') { const text = value.trim(); return text.length > 0 && text !== '待确认' && !text.startsWith('待确认：') } return value !== undefined && value !== null }
function fieldPresent(field: FieldDefinition) { const value = content[field.id]; if (!Array.isArray(value)) return scalarPresent(value); if (!value.length) return false; if (field.type !== 'table') return value.every(scalarPresent); return value.every((row) => field.columns?.every((column) => scalarPresent((row as Record<string, unknown>)[column.id]))) }
function groupComplete(fields: FieldDefinition[]) { const required = fields.filter((field) => field.required); return required.length ? Math.round(required.filter(fieldPresent).length / required.length * 100) : 100 }
async function sync() {
  syncing.value = true
  for (const key of Object.keys(content)) delete content[key]
  Object.assign(content, document.value?.content ?? {}); markdown.value = document.value?.markdown ?? ''; saved.value = true; error.value = ''
  await nextTick(); syncing.value = false
}
async function load() { await store.loadBootstrap(); await store.loadProject(projectId.value); await sync() }
async function save(kind = pendingKind) {
  if (!definition.value || syncing.value) return
  saving.value = true; error.value = ''
  try {
    const input = kind === 'markdown' ? { markdown: markdown.value } : { content: { ...content } }
    const result = await store.saveDocument(projectId.value, activeType.value, input)
    if (kind === 'structured') { syncing.value = true; markdown.value = result.markdown; await nextTick(); syncing.value = false }
    saved.value = true
  } catch (cause) { error.value = (cause as Error).message } finally { saving.value = false }
}
function schedule(kind: EditMode) { if (syncing.value) return; pendingKind = kind; saved.value = false; clearTimeout(timer); timer = window.setTimeout(() => void save(kind), 700) }
async function flush() { clearTimeout(timer); if (!saved.value && !saving.value) await save() }
async function openDocument(type: DocumentType) { if (type === activeType.value) return; await flush(); await router.replace({ name: 'workspace-documents', params: { id: projectId.value, type } }) }
async function setMode(next: EditMode) { if (next === mode.value) return; await flush(); mode.value = next }

watch(() => route.params.type, sync)
watch(content, () => schedule('structured'), { deep: true })
watch(markdown, () => schedule('markdown'))
onMounted(load); onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <section v-if="store.currentProject" class="editor">
    <header class="editor__top">
      <div><button @click="router.push({name:'workspace-projects'})">← 所有项目</button><h1>{{ store.currentProject.name }}</h1></div>
      <div class="save-state" :class="{error}">{{ error || (saving ? '保存中…' : saved ? '已保存' : '待保存') }}</div>
      <BaseButton variant="ghost" @click="router.push({name:'workspace-interview',params:{id:projectId}})">AI 访谈</BaseButton>
      <BaseButton variant="secondary" @click="router.push({name:'workspace-todo-list',params:{id:projectId}})">开发 TodoList</BaseButton>
      <BaseButton @click="router.push({name:'workspace-generate',params:{id:projectId}})">生成仓库</BaseButton>
    </header>
    <div class="editor__body">
      <aside>
        <div class="progress"><span>文档完整度</span><strong>{{ store.currentProject.completeness }}%</strong></div>
        <nav><button v-for="item in store.bootstrap?.documentDefinitions" :key="item.type" :class="{active:item.type===activeType}" @click="openDocument(item.type)"><span>{{ item.title }}</span><b>{{ store.documents.find(doc=>doc.type===item.type)?.completeness??0 }}%</b></button></nav>
      </aside>
      <main v-if="definition">
        <header><div><h2>{{ definition.title }}</h2><p>{{ definition.description }}</p></div><span>{{ document?.completeness ?? 0 }}%</span></header>
        <div class="mode-switch" role="group" aria-label="编辑方式"><button :class="{active:mode==='markdown'}" @click="setMode('markdown')">Markdown 编辑</button><button :class="{active:mode==='structured'}" @click="setMode('structured')">结构化填写</button></div>
        <textarea v-if="mode==='markdown'" v-model="markdown" class="markdown-editor" aria-label="Markdown 正文" spellcheck="false"></textarea>
        <div v-else class="form-fields"><section v-for="group in fieldGroups" :key="group.name||'default'" class="field-group"><header v-if="group.name"><h3>{{ group.name }}</h3><span>{{ group.complete }}%</span></header><div class="field-group__body"><DocumentField v-for="field in group.fields" :key="field.id" :field="field" :model-value="content[field.id]" @update:model-value="content[field.id]=$event" /></div></section></div>
      </main>
      <section class="preview"><header><strong>Markdown 阅读视图</strong><span>实时预览</span></header><div class="preview__body"><MarkdownPreview :source="markdown" /></div></section>
    </div>
  </section>
  <div v-else class="loading">正在打开项目…</div>
</template>

<style scoped lang="less">
.editor{height:calc(100vh - 104px);display:flex;flex-direction:column}.editor__top{display:flex;align-items:center;gap:18px;margin-bottom:14px}.editor__top>div:first-child{display:flex;align-items:center;gap:12px;min-width:0}.editor__top button{border:0;background:transparent;color:@color-text-secondary;cursor:pointer}.editor__top h1{font-size:19px;white-space:nowrap}.save-state{margin-left:auto;font-size:12px;color:@color-success}.save-state.error{color:@color-danger}.editor__body{min-height:0;flex:1;display:grid;grid-template-columns:210px minmax(380px,1fr) minmax(320px,.85fr);border:1px solid @color-border;border-radius:@radius-md;background:#fff;overflow:hidden}.editor__body>aside{border-right:1px solid @color-border;background:@color-bg-muted;padding:14px}.progress{display:flex;justify-content:space-between;font-size:12px;margin-bottom:12px}.progress span{color:@color-text-secondary}.progress strong{color:@color-primary}nav{display:flex;flex-direction:column;gap:3px}nav button{border:0;background:transparent;border-radius:@radius-sm;padding:9px;text-align:left;display:flex;justify-content:space-between;gap:8px;color:@color-text-secondary;cursor:pointer}nav button.active{background:#fff;color:@color-text;box-shadow:0 0 0 1px @color-border}nav button b{font-size:11px;font-weight:500}main{min-width:0;overflow:auto;padding:22px;border-right:1px solid @color-border;display:flex;flex-direction:column}main>header{display:flex;justify-content:space-between;margin-bottom:16px}main h2{font-size:19px}main p{font-size:12px;color:@color-text-secondary;margin-top:4px}main>header>span{font-size:12px;color:@color-primary}.mode-switch{display:inline-flex;align-self:flex-start;padding:3px;margin-bottom:14px;border:1px solid @color-border;border-radius:@radius-sm;background:@color-bg-muted}.mode-switch button{border:0;border-radius:3px;padding:7px 11px;background:transparent;color:@color-text-secondary;cursor:pointer}.mode-switch button.active{background:#fff;color:@color-text;box-shadow:0 1px 3px rgb(0 0 0 / 8%)}.markdown-editor{flex:1;min-height:520px;width:100%;resize:none;border:1px solid @color-border-strong;border-radius:@radius-sm;padding:18px;background:#fcfdfb;color:#263024;font:13px/1.75 ui-monospace,SFMono-Regular,Menlo,monospace;outline:none}.markdown-editor:focus{border-color:@color-primary;box-shadow:0 0 0 2px fade(@color-primary,15%)}.form-fields{display:flex;flex-direction:column;gap:30px}.field-group{border-top:1px solid @color-border;padding-top:16px}.field-group:first-child{border-top:0;padding-top:0}.field-group>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.field-group h3{font-size:15px}.field-group>header span{font-size:11px;color:@color-primary}.field-group__body{display:flex;flex-direction:column;gap:22px}.preview{min-width:0;display:flex;flex-direction:column;background:#fbfcfe}.preview>header{height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid @color-border;font-size:12px}.preview>header span{color:@color-text-secondary}.preview__body{padding:22px;overflow:auto}.loading{padding:80px;text-align:center;color:@color-text-secondary}@media(max-width:980px){.editor{height:auto}.editor__body{grid-template-columns:180px 1fr}.preview{grid-column:1/-1;min-height:360px;border-top:1px solid @color-border}.markdown-editor{min-height:560px}}@media(max-width:680px){.editor__top{flex-wrap:wrap}.editor__body{display:block}.editor__body>aside{border-right:0;border-bottom:1px solid @color-border;overflow:auto}nav{flex-direction:row;width:max-content}nav button{min-width:150px}main{border-right:0;padding:18px}.markdown-editor{min-height:520px;resize:vertical}.preview{min-height:320px}.preview__body{padding:18px}}
</style>
