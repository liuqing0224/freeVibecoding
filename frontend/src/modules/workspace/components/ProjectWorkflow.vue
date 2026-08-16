<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

type WorkflowStage = 'business' | 'technical' | 'todo' | 'repository'
const props = withDefaults(defineProps<{ active: WorkflowStage; syncing?: boolean; syncEnabled?: boolean }>(), { syncing: false, syncEnabled: false })
const emit = defineEmits<{ sync: [] }>()
const route = useRoute(); const router = useRouter(); const projectId = String(route.params.id)

function openDocuments(type: 'prd' | 'technical') { router.push({ name: 'workspace-documents', params: { id: projectId, type } }) }
function openTechnical() { if (props.syncEnabled) emit('sync'); else openDocuments('technical') }
</script>

<template>
  <nav class="workflow" aria-label="产研流程">
    <button :class="{ active: active === 'business' }" @click="openDocuments('prd')"><b>1</b><span><strong>完善业务文档</strong><small>PRD、交互与页面说明</small></span></button>
    <button :class="{ active: active === 'technical' }" :disabled="syncing" @click="openTechnical"><b>2</b><span><strong>{{ syncing ? '同步中…' : '同步技术文档' }}</strong><small>技术、数据、接口、开发、测试、发布、迭代</small></span></button>
    <button :class="{ active: active === 'todo' }" @click="router.push({ name: 'workspace-todo-list', params: { id: projectId } })"><b>3</b><span><strong>生成开发 TodoList</strong><small>按接口、页面、字段和用例拆分</small></span></button>
    <button :class="{ active: active === 'repository' }" @click="router.push({ name: 'workspace-generate', params: { id: projectId } })"><b>4</b><span><strong>配置并生成仓库</strong><small>本机目录、GitHub 或 GitLab</small></span></button>
  </nav>
</template>

<style scoped lang="less">
.workflow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px;border:1px solid @color-border-strong;background:#fff}.workflow button{min-width:0;display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;align-items:center;padding:11px;border:0;border-right:1px solid @color-border;background:#fff;text-align:left;cursor:pointer}.workflow button:last-child{border-right:0}.workflow button:hover{background:@color-bg-muted}.workflow button.active{background:@color-primary}.workflow button:disabled{cursor:wait;opacity:.65}.workflow b{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#171814;color:#fff;font-size:10px}.workflow span{min-width:0;display:flex;flex-direction:column;gap:2px}.workflow strong{font-size:12px}.workflow small{overflow:hidden;color:@color-text-secondary;font-size:9px;line-height:1.3;text-overflow:ellipsis;white-space:nowrap}@media(max-width:900px){.workflow{grid-template-columns:repeat(2,1fr)}.workflow button:nth-child(2){border-right:0}.workflow button:nth-child(-n+2){border-bottom:1px solid @color-border}}@media(max-width:520px){.workflow{grid-template-columns:1fr}.workflow button{border-right:0;border-bottom:1px solid @color-border}.workflow button:last-child{border-bottom:0}.workflow small{white-space:normal}}
</style>
