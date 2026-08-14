<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton/index.vue'
import { workspaceApi } from '../api'
import InterviewMessageCard from '../components/InterviewMessage.vue'
import { useWorkspaceStore } from '../store'
import type { CodingAgent, CodingAgentId, DocumentPatch, InterviewMessage } from '../types'

const route = useRoute(); const router = useRouter(); const store = useWorkspaceStore()
const projectId = String(route.params.id); const agents = ref<CodingAgent[]>([]); const agentId = ref<CodingAgentId>('codex')
const messages = ref<InterviewMessage[]>([{ role: 'assistant', content: '项目已经创建，建项信息已用于初始化九份文档。接下来请继续补充业务规则、页面流程或验收要求，我会逐轮整理并给出待确认修改。' }])
const input = ref(''); const sending = ref(false); const applying = ref(false); const error = ref(''); const patches = ref<DocumentPatch[]>([])
const storageKey=`workspace-project-interview-${projectId}`;const workingDocument=ref(localStorage.getItem(storageKey)??'')
const availableAgents = computed(() => agents.value.filter((agent) => agent.available))

onMounted(async () => {
  const [, , detected] = await Promise.all([store.loadBootstrap(), store.loadProject(projectId), workspaceApi.agents()])
  agents.value = detected
  agentId.value = availableAgents.value[0]?.id ?? 'codex'
})

async function send() {
  const message = input.value.trim(); if (!message || sending.value) return
  const history = messages.value.slice(-20); messages.value.push({ role: 'user', content: message }); input.value = ''; sending.value = true; error.value = ''
  try {
    const result = await workspaceApi.interview(projectId, agentId.value, message, history, workingDocument.value)
    workingDocument.value = result.workingDocument; localStorage.setItem(storageKey, workingDocument.value)
    const questionText = result.questions.length ? `\n\n还需要确认：\n${result.questions.map((item) => `- ${item}`).join('\n')}` : ''
    messages.value.push({ role: 'assistant', content: `${result.reply}${questionText}` }); patches.value = result.patches
  } catch (e) { error.value = (e as Error).message } finally { sending.value = false }
}

async function applyPatches() {
  applying.value = true; error.value = ''
  try {
    for (const patch of patches.value) {
      const current = store.documents.find((document) => document.type === patch.documentType)
      if (current) await store.saveDocument(projectId, patch.documentType, { content: { ...current.content, ...patch.fields } })
    }
    patches.value = []; await store.loadProject(projectId)
    messages.value.push({ role: 'assistant', content: '建议已写入文档，你可以继续补充业务信息。' })
  } catch (e) { error.value = (e as Error).message } finally { applying.value = false }
}
</script>

<template>
  <section v-if="store.currentProject" class="interview">
    <header><button @click="router.push({ name:'workspace-documents', params:{ id:projectId, type:'prd' } })">← 返回文档</button><div><h1>AI 需求访谈</h1><p>{{ store.currentProject.name }} · Agent 只提出建议，确认后才会更新文档。</p></div></header>
    <div class="interview__layout">
      <main>
        <div class="agent-select"><label>本机 Agent<select v-model="agentId" :disabled="sending"><option v-for="agent in availableAgents" :key="agent.id" :value="agent.id">{{ agent.name }} · {{ agent.version }}</option></select></label><span v-if="!availableAgents.length">未发现可用 Coding Agent</span></div>
        <div class="messages"><InterviewMessageCard v-for="(message,index) in messages" :key="index" :message="message"/><p v-if="sending" class="thinking">正在整理并判断下一步问题…</p></div>
        <form @submit.prevent="send"><textarea v-model="input" rows="3" placeholder="用业务语言回答，不需要写技术方案" /><BaseButton type="submit" :disabled="!input.trim()||!availableAgents.length" :loading="sending">发送</BaseButton></form><p v-if="error" class="error">{{ error }}</p>
      </main>
      <aside><header><h2>访谈临时文档</h2><span>自动保存</span></header><pre class="working-document">{{ workingDocument || '下一轮对话后自动生成，并持续作为 Agent 的上下文。' }}</pre><header class="patch-header"><h2>待确认修改</h2><span>{{ patches.length }} 份文档</span></header><p v-if="!patches.length" class="empty">Agent 给出的内容会先显示在这里，不会自动覆盖文档。</p><article v-for="patch in patches" :key="patch.documentType"><strong>{{ store.bootstrap?.documentDefinitions.find(item=>item.type===patch.documentType)?.title }}</strong><dl><div v-for="(value,key) in patch.fields" :key="key"><dt>{{ store.bootstrap?.documentDefinitions.find(item=>item.type===patch.documentType)?.fields.find(item=>item.id===key)?.label ?? key }}</dt><dd>{{ Array.isArray(value)?value.join('、'):String(value) }}</dd></div></dl></article><BaseButton v-if="patches.length" :loading="applying" @click="applyPatches">确认并写入文档</BaseButton></aside>
    </div>
  </section>
</template>

<style scoped lang="less">.interview{max-width:1180px;margin:0 auto}.interview>header{display:flex;gap:18px;align-items:flex-start;margin-bottom:18px}.interview>header button{border:0;background:transparent;padding:6px 0;color:@color-text-secondary;cursor:pointer}.interview h1{font-size:24px}.interview>header p{margin-top:4px;color:@color-text-secondary;font-size:13px}.interview__layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;border:1px solid @color-border;border-radius:@radius-md;background:#fff;min-height:650px;overflow:hidden}.interview main{display:flex;flex-direction:column;min-width:0;border-right:1px solid @color-border}.agent-select{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid @color-border;background:@color-bg-muted}.agent-select label{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600}.agent-select select{padding:7px 9px;border:1px solid @color-border-strong;border-radius:@radius-sm;background:#fff}.agent-select span{font-size:12px;color:@color-danger}.messages{flex:1;padding:20px;display:flex;flex-direction:column;gap:16px;overflow:auto}.thinking{font-size:13px;color:@color-text-secondary}.interview form{display:flex;gap:10px;padding:16px;border-top:1px solid @color-border}.interview textarea{flex:1;resize:vertical;border:1px solid @color-border-strong;border-radius:@radius-sm;padding:10px;font:inherit}.error{padding:0 16px 14px;color:@color-danger;font-size:13px}.interview aside{padding:18px;overflow:auto;background:#fbfcfe}.interview aside>header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.interview aside h2{font-size:16px}.interview aside>header span,.empty{font-size:12px;color:@color-text-secondary}.working-document{max-height:260px;overflow:auto;white-space:pre-wrap;font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace;color:#475569;padding-bottom:16px}.patch-header{padding-top:16px;border-top:1px solid @color-border}.interview aside article{padding:14px 0;border-top:1px solid @color-border}.interview aside article>strong{font-size:14px}.interview dl div{margin-top:10px}.interview dt{font-size:11px;color:@color-text-secondary}.interview dd{font-size:13px;margin-top:2px;white-space:pre-wrap}.interview aside>button{width:100%;margin-top:14px}@media(max-width:820px){.interview__layout{grid-template-columns:1fr}.interview main{border-right:0}.interview aside{border-top:1px solid @color-border}.messages{min-height:420px}}
</style>
