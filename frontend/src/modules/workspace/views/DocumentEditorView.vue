<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DocumentField from '../components/DocumentField.vue'
import MarkdownPreview from '../components/MarkdownPreview.vue'
import ProjectWorkflow from '../components/ProjectWorkflow.vue'
import { useWorkspaceStore } from '../store'
import type { DocumentField as FieldDefinition, DocumentType } from '../types'

type EditMode = 'markdown' | 'structured'
const route = useRoute(); const router = useRouter(); const store = useWorkspaceStore()
const content = reactive<Record<string, unknown>>({}); const markdown = ref(''); const mode = ref<EditMode>('markdown')
const saving = ref(false); const saved = ref(true); const error = ref(''); const syncing = ref(false)
const syncingTechnical = ref(false); const syncMessage = ref('')
let timer: number | undefined; let pendingKind: EditMode = 'markdown'
const projectId = computed(() => String(route.params.id)); const activeType = computed(() => String(route.params.type || 'prd') as DocumentType)
const definition = computed(() => store.bootstrap?.documentDefinitions.find((item) => item.type === activeType.value))
const document = computed(() => store.documents.find((item) => item.type === activeType.value))
const averageQuality = computed(() => store.documents.length ? Math.round(store.documents.reduce((sum, item) => sum + item.quality.score, 0) / store.documents.length) : 0)
const businessTypes: DocumentType[] = ['prd', 'ux']
const businessDefinitions = computed(() => store.bootstrap?.documentDefinitions.filter((item) => businessTypes.includes(item.type)) ?? [])
const technicalDefinitions = computed(() => store.bootstrap?.documentDefinitions.filter((item) => !businessTypes.includes(item.type)) ?? [])
const activeStage = computed(() => businessTypes.includes(activeType.value) ? 'business' : 'technical')
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
    if (activeType.value === 'prd') syncMessage.value = '技术相关文档已按结构化 PRD 自动同步'
    saved.value = true
  } catch (cause) { error.value = (cause as Error).message } finally { saving.value = false }
}
function schedule(kind: EditMode) { if (syncing.value) return; pendingKind = kind; saved.value = false; clearTimeout(timer); timer = window.setTimeout(() => void save(kind), 700) }
async function flush() { clearTimeout(timer); if (!saved.value && !saving.value) await save() }
async function openDocument(type: DocumentType) { if (type === activeType.value) return; await flush(); await router.replace({ name: 'workspace-documents', params: { id: projectId.value, type } }) }
async function setMode(next: EditMode) { if (next === mode.value) return; await flush(); mode.value = next }
async function optimizeCurrentDocument() { await flush(); await router.push({ name: 'workspace-interview', params: { id: projectId.value }, query: { document: activeType.value } }) }
async function syncTechnicalDocuments() {
  await flush(); syncingTechnical.value = true; syncMessage.value = ''; error.value = ''
  try { await store.syncTechnicalDocuments(projectId.value); await sync(); syncMessage.value = '6 份技术相关文档已同步' }
  catch (cause) { error.value = (cause as Error).message }
  finally { syncingTechnical.value = false }
}
async function syncAndOpenTechnical() { await syncTechnicalDocuments(); if (!error.value) await openDocument('technical') }

watch(() => route.params.type, sync)
watch(content, () => schedule('structured'), { deep: true })
watch(markdown, () => schedule('markdown'))
onMounted(load); onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <section v-if="store.currentProject" class="editor">
    <header class="editor__top">
      <div><button @click="router.push({name:'workspace-projects'})">← 所有项目</button><h1>{{ store.currentProject.name }}</h1></div>
      <button v-if="activeStage==='business'" class="interview-link" @click="optimizeCurrentDocument">用 Agent 优化当前文档</button><div class="save-state" :class="{error}">{{ error || (saving ? '保存中…' : saved ? '已保存' : '待保存') }}</div>
    </header>
    <ProjectWorkflow :active="activeStage" :syncing="syncingTechnical" sync-enabled @sync="syncAndOpenTechnical" />
    <div class="editor__body">
      <aside>
        <div class="progress"><span>整体完整度</span><strong>{{ store.currentProject.completeness }}%</strong><span>平均质量分</span><strong>{{ averageQuality }}</strong></div>
        <nav><section><h2>业务文档</h2><button v-for="item in businessDefinitions" :key="item.type" :class="{active:item.type===activeType}" @click="openDocument(item.type)"><span>{{ item.title }}</span><b><em>完整 {{ store.documents.find(doc=>doc.type===item.type)?.completeness??0 }}%</em><em>质量 {{ store.documents.find(doc=>doc.type===item.type)?.quality.score??0 }}</em></b></button></section><section><h2>技术文档</h2><button v-for="item in technicalDefinitions" :key="item.type" :class="{active:item.type===activeType}" @click="openDocument(item.type)"><span>{{ item.title }}</span><b><em>完整 {{ store.documents.find(doc=>doc.type===item.type)?.completeness??0 }}%</em><em>质量 {{ store.documents.find(doc=>doc.type===item.type)?.quality.score??0 }}</em></b></button></section></nav>
      </aside>
      <main v-if="definition">
        <header><div><h2>{{ definition.title }}</h2><p>{{ definition.description }}</p></div><span>{{ document?.quality.score ?? 0 }} 分 · {{ document?.quality.level }}</span></header>
        <div class="mode-switch" role="group" aria-label="编辑方式"><button :class="{active:mode==='markdown'}" @click="setMode('markdown')">Markdown 编辑</button><button :class="{active:mode==='structured'}" @click="setMode('structured')">结构化填写</button></div>
        <p v-if="activeType==='prd'" class="sync-hint">结构化 PRD 是技术文档生成依据；保存后自动同步。{{ syncMessage }}</p>
        <p v-else-if="syncMessage" class="sync-hint">{{ syncMessage }}</p>
        <section v-if="document" class="quality-panel">
          <header><div><strong>内容质量 {{ document.quality.score }} 分</strong><span>{{ document.quality.level }}</span></div><small>完整度 {{ document.completeness }}%</small></header>
          <div class="quality-panel__dimensions"><div v-for="item in document.quality.dimensions" :key="item.label"><span>{{ item.label }}</span><b>{{ item.score }}/{{ item.maxScore }}</b><i><em :style="{width:`${item.score/item.maxScore*100}%`}"></em></i></div></div>
          <ul v-if="document.quality.suggestions.length"><li v-for="item in document.quality.suggestions" :key="item">{{ item }}</li></ul>
          <p v-else>当前内容结构清晰且可执行，可以进入下一阶段。</p>
        </section>
        <textarea v-if="mode==='markdown'" v-model="markdown" class="markdown-editor" aria-label="Markdown 正文" spellcheck="false"></textarea>
        <div v-else class="form-fields"><section v-for="group in fieldGroups" :key="group.name||'default'" class="field-group"><header v-if="group.name"><h3>{{ group.name }}</h3><span>{{ group.complete }}%</span></header><div class="field-group__body"><DocumentField v-for="field in group.fields" :key="field.id" :field="field" :model-value="content[field.id]" @update:model-value="content[field.id]=$event" /></div></section></div>
      </main>
      <section class="preview"><header><strong>Markdown 阅读视图</strong><span>实时预览</span></header><div class="preview__body"><MarkdownPreview :source="markdown" /></div></section>
    </div>
  </section>
  <div v-else class="loading">正在打开项目…</div>
</template>

<style scoped lang="less">
.editor{height:calc(100vh - 104px);display:flex;flex-direction:column}.editor__top{display:flex;align-items:center;gap:18px;margin-bottom:10px}.editor__top>div:first-child{display:flex;align-items:center;gap:12px;min-width:0}.editor__top button{border:0;background:transparent;color:@color-text-secondary;cursor:pointer}.editor__top h1{font-size:19px;white-space:nowrap}.save-state{margin-left:auto;font-size:12px;color:@color-success}.save-state.error{color:@color-danger}.workflow-actions{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:12px;padding:9px 12px;border:1px solid @color-border;background:@color-bg-muted}.workflow-actions__title{display:flex;flex-direction:column;min-width:104px}.workflow-actions__title strong{font-size:12px}.workflow-actions__title span{margin-top:2px;color:@color-text-secondary;font-size:10px}.workflow-actions__steps{display:flex;align-items:center;justify-content:flex-end;gap:7px;min-width:0}.workflow-actions__steps :deep(.base-button),.workflow-actions__current{min-height:31px;white-space:nowrap}.workflow-actions__steps :deep(.base-button b),.workflow-actions__current b{display:inline-grid;place-items:center;width:17px;height:17px;margin-right:4px;border-radius:50%;background:#171814;color:#fff;font-size:9px}.workflow-actions__current{display:flex;align-items:center;padding:0 9px;border-bottom:2px solid @color-primary;color:@color-text;font-size:11px;font-weight:700}.editor__body{min-height:0;flex:1;display:grid;grid-template-columns:210px minmax(380px,1fr) minmax(320px,.85fr);border:1px solid @color-border;border-radius:@radius-md;background:#fff;overflow:hidden}.editor__body>aside{border-right:1px solid @color-border;background:@color-bg-muted;padding:14px}.progress{display:grid;grid-template-columns:1fr auto;gap:5px 10px;font-size:12px;margin-bottom:12px}.progress span{color:@color-text-secondary}.progress strong{color:@color-primary}nav{display:flex;flex-direction:column;gap:3px}nav button{border:0;background:transparent;border-radius:@radius-sm;padding:9px;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px;color:@color-text-secondary;cursor:pointer}nav button.active{background:#fff;color:@color-text;box-shadow:0 0 0 1px @color-border}nav button b{display:flex;flex-direction:column;align-items:flex-end;gap:2px;font-size:10px;font-weight:500;white-space:nowrap}nav button em{font-style:normal}nav button em:last-child{color:@color-primary}main{min-width:0;overflow:auto;padding:22px;border-right:1px solid @color-border;display:flex;flex-direction:column}main>header{display:flex;justify-content:space-between;margin-bottom:16px}main h2{font-size:19px}main p{font-size:12px;color:@color-text-secondary;margin-top:4px}main>header>span{font-size:12px;color:@color-primary}.mode-switch{display:inline-flex;align-self:flex-start;padding:3px;margin-bottom:14px;border:1px solid @color-border;border-radius:@radius-sm;background:@color-bg-muted}.mode-switch button{border:0;border-radius:3px;padding:7px 11px;background:transparent;color:@color-text-secondary;cursor:pointer}.mode-switch button.active{background:#fff;color:@color-text;box-shadow:0 1px 3px rgb(0 0 0 / 8%)}.quality-panel{margin:12px 0 16px;padding:14px;border:1px solid @color-border;border-radius:@radius-sm;background:@color-bg-muted}.quality-panel>header{display:flex;justify-content:space-between;align-items:center}.quality-panel>header div{display:flex;align-items:center;gap:8px}.quality-panel>header span{padding:2px 6px;background:@color-primary;font-size:10px;font-weight:700}.quality-panel>header small{color:@color-text-secondary}.quality-panel__dimensions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.quality-panel__dimensions>div{display:grid;grid-template-columns:1fr auto;gap:4px;font-size:10px}.quality-panel__dimensions i{grid-column:1/-1;height:4px;background:#dfe1d9}.quality-panel__dimensions i em{display:block;height:100%;background:@color-primary}.quality-panel ul{margin:12px 0 0;padding:10px 12px 10px 28px;background:#fff;font-size:11px;color:@color-text-secondary}.quality-panel li+li{margin-top:4px}.markdown-editor{flex:1;min-height:520px;width:100%;resize:none;border:1px solid @color-border-strong;border-radius:@radius-sm;padding:18px;background:#fcfdfb;color:#263024;font:13px/1.75 ui-monospace,SFMono-Regular,Menlo,monospace;outline:none}.markdown-editor:focus{border-color:@color-primary;box-shadow:0 0 0 2px fade(@color-primary,15%)}.form-fields{display:flex;flex-direction:column;gap:30px}.field-group{border-top:1px solid @color-border;padding-top:16px}.field-group:first-child{border-top:0;padding-top:0}.field-group>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.field-group h3{font-size:15px}.field-group>header span{font-size:11px;color:@color-primary}.field-group__body{display:flex;flex-direction:column;gap:22px}.preview{min-width:0;display:flex;flex-direction:column;background:#fbfcfe}.preview>header{height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid @color-border;font-size:12px}.preview>header span{color:@color-text-secondary}.preview__body{padding:22px;overflow:auto}.loading{padding:80px;text-align:center;color:@color-text-secondary}@media(max-width:1120px){.workflow-actions{align-items:flex-start}.workflow-actions__steps{flex-wrap:wrap}}@media(max-width:980px){.editor{height:auto}.editor__body{grid-template-columns:180px 1fr}.preview{grid-column:1/-1;min-height:360px;border-top:1px solid @color-border}.markdown-editor{min-height:560px}.quality-panel__dimensions{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.editor__top{flex-wrap:wrap}.workflow-actions{display:block}.workflow-actions__steps{justify-content:flex-start;margin-top:8px}.editor__body{display:block}.editor__body>aside{border-right:0;border-bottom:1px solid @color-border;overflow:auto}nav{flex-direction:row;width:max-content}nav button{min-width:170px}main{border-right:0;padding:18px}.markdown-editor{min-height:520px;resize:vertical}.preview{min-height:320px}.preview__body{padding:18px}}
.interview-link{margin-left:auto;text-decoration:underline;text-underline-offset:4px}.save-state{margin-left:0}.editor__body>aside,.editor__body>main,.preview{min-height:0}.editor__body>aside{overflow-y:auto}.preview{overflow:hidden}.preview__body{min-height:0;flex:1}nav{gap:14px}nav section{display:flex;flex-direction:column;gap:3px}nav h2{padding:0 9px 5px;color:@color-text-secondary;font-size:10px}@media(max-width:680px){.interview-link{margin-left:0}nav section{flex-direction:row}nav h2{display:none}}
</style>
