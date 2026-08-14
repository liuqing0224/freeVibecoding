<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton/index.vue'
import BaseEmpty from '@/components/BaseEmpty/index.vue'
import { useWorkspaceStore } from '../store'

const store = useWorkspaceStore(); const router = useRouter()
onMounted(() => store.loadProjects())
async function remove(id: string) { if (confirm('只删除工作台中的项目记录，已生成的本机目录不会删除。继续吗？')) await store.removeProject(id) }
</script>

<template><section class="projects"><header class="projects__header"><div><h1>产研项目</h1><p>从业务想法到可运行模板仓库。</p></div><BaseButton @click="router.push({ name: 'workspace-new' })">新建项目</BaseButton></header>
  <div v-if="store.loading" class="state">正在加载…</div><div v-else-if="store.error" class="state state--error">{{ store.error }}</div>
  <BaseEmpty v-else-if="store.projects.length === 0" description="还没有项目。创建第一个产研模板。"><BaseButton @click="router.push({ name: 'workspace-new' })">新建项目</BaseButton></BaseEmpty>
  <div v-else class="projects__table"><div class="projects__row projects__row--head"><span>项目</span><span>类型</span><span>文档完整度</span><span>状态</span><span></span></div>
    <div v-for="project in store.projects" :key="project.id" class="projects__row"><button class="project-name" @click="router.push({ name:'workspace-documents', params:{ id:project.id, type:'prd' } })"><strong>{{ project.name }}</strong><small>{{ project.summary }}</small></button><span>{{ project.presets.map(item => ({admin:'后台管理',website:'官网 / H5',tool:'业务工具'}[item])).join('、') }}</span><span><i><b :style="{width:`${project.completeness}%`}"></b></i>{{ project.completeness }}%</span><span>{{ project.status === 'generated' ? '已生成' : '草稿' }}</span><span class="actions"><button @click="router.push({ name:'workspace-documents', params:{id:project.id,type:'prd'} })">编辑</button><button @click="router.push({ name:'workspace-generate', params:{id:project.id} })">生成</button><button class="danger" @click="remove(project.id)">删除</button></span></div>
  </div></section></template>

<style scoped lang="less">.projects{max-width:1180px;margin:0 auto}.projects__header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}.projects__header h1{font-size:26px}.projects__header p{color:@color-text-secondary;margin-top:4px}.projects__table{border:1px solid @color-border;background:#fff;border-radius:@radius-md;overflow:hidden}.projects__row{display:grid;grid-template-columns:minmax(260px,2fr) 140px 180px 100px 170px;gap:16px;align-items:center;min-height:68px;padding:10px 16px;border-bottom:1px solid @color-border;font-size:13px}.projects__row:last-child{border-bottom:0}.projects__row--head{min-height:40px;background:@color-bg-muted;color:@color-text-secondary;font-size:12px}.project-name{display:flex;flex-direction:column;gap:3px;text-align:left;border:0;background:transparent;cursor:pointer}.project-name strong{font-size:14px;color:@color-text}.project-name small{color:@color-text-secondary;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:420px}i{display:inline-block;width:92px;height:6px;background:#e5e7eb;border-radius:3px;margin-right:8px;vertical-align:middle;overflow:hidden}i b{display:block;height:100%;background:@color-primary}.actions{display:flex;gap:10px;white-space:nowrap}.actions button{border:0;background:transparent;color:@color-primary;cursor:pointer}.actions .danger{color:@color-danger}.state{padding:60px;text-align:center;color:@color-text-secondary}.state--error{color:@color-danger}@media(max-width:800px){.projects__row{grid-template-columns:minmax(0,1fr) 132px}.projects__row>*:nth-child(2),.projects__row>*:nth-child(4){display:none}.projects__row--head{display:none}.projects__header{align-items:center}.actions{gap:8px}}
</style>
