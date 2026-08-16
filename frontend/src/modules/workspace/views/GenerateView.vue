<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton/index.vue'
import ProjectWorkflow from '../components/ProjectWorkflow.vue'
import { workspaceApi } from '../api'
import type { Bootstrap, Generation, Readiness, RepositoryProvider, Workspace } from '../types'

const route = useRoute(); const router = useRouter(); const id = computed(() => String(route.params.id))
const project = ref<Workspace | null>(null); const readiness = ref<Readiness | null>(null); const bootstrap = ref<Bootstrap | null>(null)
const generations = ref<Generation[]>([]); const directoryName = ref(''); const provider = ref<RepositoryProvider>('local'); const remoteUrl = ref('')
const generating = ref(false); const error = ref('')
const target = computed(() => `${bootstrap.value?.settings.outputRoot ?? ''}/${directoryName.value}`.replace(/\/+/g, '/'))
const remoteRequired = computed(() => provider.value !== 'local')
const canGenerate = computed(() => Boolean(readiness.value?.ready && directoryName.value && (!remoteRequired.value || remoteUrl.value.trim())))

async function load() {
  [project.value, readiness.value, generations.value, bootstrap.value] = await Promise.all([
    workspaceApi.getProject(id.value), workspaceApi.readiness(id.value), workspaceApi.generations(id.value), workspaceApi.bootstrap(),
  ])
  directoryName.value = readiness.value.suggestedDirectoryName
}
async function generate() {
  generating.value = true; error.value = ''
  try {
    const result = await workspaceApi.generate(id.value, { directoryName: directoryName.value, repositoryProvider: provider.value, remoteRepositoryUrl: remoteRequired.value ? remoteUrl.value.trim() : undefined })
    generations.value = [result, ...generations.value]; await load()
  } catch (cause) { error.value = (cause as Error).message }
  finally { generating.value = false }
}
onMounted(load)
</script>

<template>
  <section v-if="project&&readiness&&bootstrap" class="repository-page">
    <header><button @click="router.push({name:'workspace-todo-list',params:{id}})">← 返回 TodoList</button><div><h1>配置并生成仓库</h1><p>确认代码目录和 Git 仓库位置后，再生成可直接交给 Coding Agent 的项目。</p></div></header>
    <ProjectWorkflow active="repository" />
    <div class="repository-layout">
      <main>
        <section><span class="section-number">01</span><div><h2>当前代码目录</h2><p>所有文件会生成到下面的绝对路径，已有目录不会被覆盖。</p></div><label>输出根目录<input :value="bootstrap.settings.outputRoot" readonly /><small><button @click="router.push({name:'workspace-settings'})">到设置中修改根目录</button></small></label><label>项目目录名<input v-model="directoryName" /></label><code>{{ target }}</code></section>
        <section><span class="section-number">02</span><div><h2>代码仓库</h2><p>选择托管位置。工作台只配置 Git origin，不读取账号密码，也不会自动推送。</p></div><div class="provider" role="group" aria-label="仓库类型"><button v-for="item in ([['local','仅本机'],['github','GitHub'],['gitlab','GitLab']] as const)" :key="item[0]" :class="{active:provider===item[0]}" @click="provider=item[0]">{{ item[1] }}</button></div><label v-if="remoteRequired">远程仓库地址<input v-model="remoteUrl" :placeholder="provider==='github'?'https://github.com/组织/仓库.git':'https://gitlab.com/组织/仓库.git'" /><small>请先在对应平台创建空仓库，不要初始化 README。</small></label></section>
        <section><span class="section-number">03</span><div><h2>生成检查</h2><p>生成时创建九份文档、TodoList、Vue/NestJS 骨架并完成 Git 首次提交。</p></div><dl><div><dt>项目类型</dt><dd>{{ project.presets.map(item => ({admin:'后台管理',website:'官网 / H5',tool:'业务工具'}[item])).join('、') }}</dd></div><div><dt>文档完整度</dt><dd>{{ readiness.completeness }}%</dd></div><div><dt>Git 行为</dt><dd>初始化、首次提交{{ remoteRequired?'、配置 origin':'' }}</dd></div><div><dt>覆盖策略</dt><dd>禁止覆盖已有目录</dd></div></dl></section>
        <section v-if="readiness.missing.length" class="missing"><h2>还需补充</h2><p v-for="item in readiness.missing" :key="`${item.documentType}-${item.fieldId}`">{{ item.documentType }} · {{ item.label }}</p></section>
        <p v-if="error" class="error">{{ error }}</p><BaseButton :disabled="!canGenerate" :loading="generating" @click="generate">生成代码仓库</BaseButton>
      </main>
      <aside><h2>生成记录</h2><p v-if="!generations.length">暂无记录</p><article v-for="item in generations" :key="item.id"><strong :class="item.status">{{ item.status==='success'?'成功':'失败' }}</strong><code>{{ item.targetPath }}</code><small>{{ new Date(item.createdAt).toLocaleString() }}</small></article></aside>
    </div>
  </section>
  <div v-else class="loading">正在检查项目…</div>
</template>

<style scoped lang="less">
.repository-page{max-width:1120px;margin:0 auto}.repository-page>header{display:flex;gap:20px;align-items:flex-start;margin-bottom:16px}.repository-page>header>button{border:0;background:transparent;padding:6px 0;color:@color-text-secondary;text-decoration:underline;text-underline-offset:4px;cursor:pointer}.repository-page h1{font-size:25px}.repository-page>header p,section>div>p{margin-top:4px;color:@color-text-secondary;font-size:12px}.repository-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px}.repository-layout main,.repository-layout aside{border:1px solid @color-border-strong;background:#fff;padding:22px}.repository-layout main{display:flex;flex-direction:column;gap:0}.repository-layout main>section{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px 14px;padding:4px 0 24px;border-bottom:1px solid @color-border}.repository-layout main>section+section{padding-top:24px}.section-number{grid-row:1/6;display:grid;place-items:center;width:28px;height:28px;background:#171814;color:@color-primary;font-size:10px;font-weight:800}.repository-layout h2{font-size:16px}.repository-layout label,.repository-layout code,.provider,.repository-layout dl{grid-column:2}.repository-layout label{display:flex;flex-direction:column;gap:6px;margin-top:14px;font-size:12px;font-weight:700}.repository-layout input{width:100%;padding:10px;border:1px solid @color-border-strong;border-radius:@radius-sm;background:#fff}.repository-layout input[readonly]{background:@color-bg-muted;color:@color-text-secondary}.repository-layout label small{color:@color-text-secondary;font-weight:400}.repository-layout label small button{border:0;background:transparent;padding:0;text-decoration:underline;cursor:pointer}.repository-layout code{display:block;margin-top:12px;padding:10px;background:#171814;color:@color-primary;font-size:12px;overflow-wrap:anywhere}.provider{display:flex;margin-top:14px}.provider button{flex:1;padding:9px;border:1px solid @color-border-strong;background:#fff;cursor:pointer}.provider button+button{border-left:0}.provider button.active{background:@color-primary;font-weight:800}.repository-layout dl{margin-top:10px}.repository-layout dl>div{display:flex;justify-content:space-between;gap:20px;padding:9px 0;border-bottom:1px solid @color-border;font-size:12px}.repository-layout dt{color:@color-text-secondary}.repository-layout dd{text-align:right}.repository-layout main>.missing{display:block;border-left:3px solid @color-warning;padding-left:14px}.missing p{font-size:12px;color:@color-text-secondary}.error{margin:16px 0;color:@color-danger}.repository-layout main>.base-button{align-self:flex-start;margin-top:22px}.repository-layout aside h2{font-size:16px;margin-bottom:12px}.repository-layout aside>p{color:@color-text-secondary;font-size:12px}.repository-layout article{padding:12px 0;border-bottom:1px solid @color-border}.repository-layout article strong{font-size:11px}.repository-layout article strong.success{color:@color-success}.repository-layout article strong.failed,.error{color:@color-danger}.repository-layout article code{margin-top:7px;padding:7px;background:@color-bg-muted;color:@color-text-secondary}.repository-layout article small{display:block;margin-top:5px;color:@color-text-secondary}.loading{padding:80px;text-align:center;color:@color-text-secondary}@media(max-width:760px){.repository-page>header{display:block}.repository-layout{grid-template-columns:1fr}.repository-layout main,.repository-layout aside{padding:17px}}
</style>
