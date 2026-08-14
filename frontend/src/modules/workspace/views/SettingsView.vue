<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton/index.vue'
import { workspaceApi } from '../api'
import type { CodingAgent } from '../types'

const outputRoot=ref('');const saving=ref(false);const message=ref('');const agents=ref<CodingAgent[]>([])
onMounted(async()=>{const [bootstrap,detected]=await Promise.all([workspaceApi.bootstrap(),workspaceApi.agents()]);outputRoot.value=bootstrap.settings.outputRoot;agents.value=detected})
async function save(){saving.value=true;message.value='';try{await workspaceApi.updateSettings(outputRoot.value);message.value='已保存'}catch(e){message.value=(e as Error).message}finally{saving.value=false}}
</script>

<template><section class="settings"><header><h1>本机设置</h1><p>工作台只在配置的根目录下生成新仓库。</p></header><form @submit.prevent="save"><label>输出根目录<input v-model="outputRoot" placeholder="/Users/you/Documents/VibeCodingProjects" /><small>必须填写绝对路径；生成时不会覆盖已有项目目录。</small></label><div><BaseButton type="submit" :loading="saving">保存设置</BaseButton><span>{{ message }}</span></div></form><section class="agents"><header><div><h2>本机 Coding Agent</h2><p>只读探测，不读取或保存 API Key。</p></div></header><article v-for="agent in agents" :key="agent.id"><div><strong>{{ agent.name }}</strong><small>{{ agent.version ?? '未安装' }}</small></div><span :class="{available:agent.available}">{{ agent.available?'可用于 AI 访谈':'不可用' }}</span></article></section></section></template>

<style scoped lang="less">.settings{max-width:760px;margin:0 auto}.settings>header{margin-bottom:22px}.settings h1{font-size:25px}.settings p{color:@color-text-secondary;margin-top:4px}.settings form,.agents{border:1px solid @color-border;border-radius:@radius-md;background:#fff;padding:24px}.settings label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:600}.settings input{border:1px solid @color-border-strong;border-radius:@radius-sm;padding:10px;font:inherit}.settings small{font-weight:400;color:@color-text-secondary}.settings form>div{display:flex;align-items:center;gap:12px;margin-top:20px}.settings form span{font-size:12px;color:@color-text-secondary}.agents{margin-top:18px}.agents>header{margin-bottom:14px}.agents h2{font-size:17px}.agents>header p{font-size:12px}.agents article{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-top:1px solid @color-border}.agents article div{display:flex;flex-direction:column;gap:3px}.agents article span{font-size:12px;color:@color-text-secondary}.agents article span.available{color:@color-success}
</style>
