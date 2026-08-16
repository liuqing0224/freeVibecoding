<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectWorkflow from '../components/ProjectWorkflow.vue'
import { workspaceApi } from '../api'
import { useWorkspaceStore } from '../store'
import type { DocumentType, TodoList } from '../types'

const route = useRoute(); const router = useRouter(); const store = useWorkspaceStore()
const projectId = String(route.params.id); const todoList = ref<TodoList | null>(null); const loading = ref(true); const error = ref('')
const documentLabels: Record<DocumentType, string> = { prd:'PRD', ux:'交互说明', technical:'技术方案', database:'数据库', api:'API', development:'开发计划', test:'测试验收', release:'发布方案', changelog:'迭代记录' }

onMounted(async () => {
  try { await store.loadProject(projectId); todoList.value = await workspaceApi.todoList(projectId) }
  catch (cause) { error.value = (cause as Error).message }
  finally { loading.value = false }
})

function openDocument(type: DocumentType) { router.push({ name:'workspace-documents', params:{ id:projectId, type } }) }
</script>

<template>
  <section class="todo-page">
    <header class="todo-page__header">
      <button @click="openDocument('prd')">← 返回文档</button>
      <div><h1>开发 TodoList</h1><p v-if="store.currentProject">{{ store.currentProject.name }} · 根据九份产研文档实时拆分</p></div>
    </header>
    <ProjectWorkflow active="todo" />

    <div v-if="loading" class="state">正在拆分详细任务…</div>
    <div v-else-if="error" class="state state--error">{{ error }}</div>
    <section v-else-if="todoList && !todoList.ready" class="blocked">
      <div class="blocked__score"><strong>{{ todoList.completeness }}%</strong><span>文档完整度</span></div>
      <div><h2>完成文档后生成 TodoList</h2><p>还有 {{ todoList.missing.length }} 个必填项未完成。补齐后会自动按接口、页面、字段和测试用例拆分。</p></div>
      <ul><li v-for="item in todoList.missing" :key="`${item.documentType}-${item.fieldId}`"><button @click="openDocument(item.documentType)"><span>{{ documentLabels[item.documentType] }}</span><strong>{{ item.label }}</strong><b>去补充 →</b></button></li></ul>
    </section>
    <div v-else-if="todoList" class="todo-layout">
      <aside><strong>{{ todoList.total }}</strong><span>个独立 Todo</span><nav><a v-for="group in todoList.groups" :key="group.category" :href="`#${group.category}`"><span>{{ group.title }}</span><b>{{ group.items.length }}</b></a></nav></aside>
      <main>
        <section v-for="group in todoList.groups" :id="group.category" :key="group.category" class="todo-group">
          <header><h2>{{ group.title }}</h2><span>{{ group.items.length }} 项</span></header>
          <article v-for="item in group.items" :key="item.id" class="todo-item">
            <span class="todo-item__check" aria-hidden="true"></span>
            <div><header><code>{{ item.id }}</code><h3>{{ item.title }}</h3></header><p>{{ item.detail }}</p><dl><div><dt>完成标准</dt><dd>{{ item.acceptance }}</dd></div><div><dt>来源</dt><dd>{{ item.sourceDocument }} · {{ item.sourceField }}</dd></div></dl></div>
          </article>
        </section>
      </main>
    </div>
  </section>
</template>

<style scoped lang="less">
.todo-page{max-width:1180px;margin:0 auto}.todo-page__header{display:grid;grid-template-columns:130px minmax(0,1fr) auto;gap:22px;align-items:start;margin-bottom:22px}.todo-page__header>button{border:0;background:transparent;padding:7px 0;text-align:left;text-decoration:underline;text-underline-offset:4px;font-size:12px;font-weight:700;cursor:pointer}.todo-page h1{font-size:32px;line-height:1.15}.todo-page__header p{margin-top:6px;color:@color-text-secondary;font-size:13px}.state,.blocked{border:1px solid @color-border-strong;border-radius:@radius-lg;background:#fff;box-shadow:6px 6px 0 #d6d8cf}.state{padding:80px;text-align:center}.state--error{color:@color-danger}.blocked{display:grid;grid-template-columns:120px minmax(0,1fr);gap:22px;padding:26px}.blocked__score{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100px;border:1px solid @color-border-strong;background:@color-primary}.blocked__score strong{font-size:28px}.blocked__score span{font-size:11px}.blocked h2{font-size:21px}.blocked p{margin-top:7px;color:@color-text-secondary}.blocked ul{grid-column:1/-1;border-top:1px solid @color-border-strong}.blocked li{border-bottom:1px solid @color-border}.blocked li button{width:100%;display:grid;grid-template-columns:110px minmax(0,1fr) auto;gap:14px;padding:12px 4px;border:0;background:transparent;text-align:left;cursor:pointer}.blocked li span,.blocked li b{font-size:12px;color:@color-text-secondary}.blocked li b{color:@color-text}.todo-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:24px;align-items:start}.todo-layout>aside{position:sticky;top:20px;border:1px solid @color-border-strong;border-radius:@radius-md;background:#171814;color:#fff;overflow:hidden}.todo-layout>aside>strong{display:block;padding:20px 18px 0;color:@color-primary;font-size:34px}.todo-layout>aside>span{display:block;padding:0 18px 18px;font-size:12px;color:#bfc1b8}.todo-layout nav{border-top:1px solid #44463f}.todo-layout nav a{display:flex;justify-content:space-between;padding:11px 14px;border-bottom:1px solid #34362f;color:#fff;font-size:12px}.todo-layout nav a:hover{background:#292b25}.todo-layout nav b{color:@color-primary}.todo-layout main{min-width:0}.todo-group{scroll-margin-top:20px;border:1px solid @color-border-strong;border-radius:@radius-md;background:#fff;overflow:hidden;box-shadow:4px 4px 0 #d6d8cf}.todo-group+.todo-group{margin-top:18px}.todo-group>header{display:flex;justify-content:space-between;align-items:center;padding:13px 16px;background:@color-primary;border-bottom:1px solid @color-border-strong}.todo-group h2{font-size:16px}.todo-group>header span{font-size:11px;font-weight:700}.todo-item{display:grid;grid-template-columns:22px minmax(0,1fr);gap:12px;padding:16px;border-bottom:1px solid @color-border}.todo-item:last-child{border-bottom:0}.todo-item__check{width:18px;height:18px;margin-top:2px;border:1px solid @color-border-strong;background:#fff}.todo-item>div>header{display:flex;align-items:baseline;gap:10px}.todo-item code{padding:2px 5px;background:#171814;color:@color-primary;border-radius:@radius-sm;font-size:10px;font-weight:700}.todo-item h3{font-size:14px}.todo-item p{margin-top:7px;color:@color-text-secondary;font-size:13px;line-height:1.55}.todo-item dl{display:grid;grid-template-columns:1fr 220px;gap:12px;margin-top:11px}.todo-item dl>div{padding:9px 10px;background:@color-bg-muted}.todo-item dt{font-size:10px;font-weight:700;color:@color-text-secondary}.todo-item dd{margin-top:3px;font-size:12px;line-height:1.5}@media(max-width:760px){.todo-page__header{grid-template-columns:1fr auto}.todo-page__header>button{grid-column:1/-1}.todo-page h1{font-size:27px}.todo-layout{grid-template-columns:1fr}.todo-layout>aside{position:static}.todo-layout nav{display:flex;overflow:auto}.todo-layout nav a{min-width:150px;border-right:1px solid #34362f}.todo-item dl{grid-template-columns:1fr}.blocked{grid-template-columns:1fr}.blocked li button{grid-template-columns:80px minmax(0,1fr)}.blocked li b{grid-column:2}}
</style>
