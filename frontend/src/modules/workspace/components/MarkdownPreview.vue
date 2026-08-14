<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

const props = defineProps<{ source: string }>()
const html = computed(() => DOMPurify.sanitize(marked.parse(props.source, { gfm: true }) as string))
</script>

<template>
  <!-- The rendered HTML is sanitized with DOMPurify before it reaches the DOM. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <article class="markdown-body" v-html="html"></article>
</template>

<style scoped lang="less">
.markdown-body{font-size:14px;line-height:1.75;color:@color-text;overflow-wrap:anywhere}
.markdown-body :deep(h1){font-size:26px;margin:0 0 20px;padding-bottom:12px;border-bottom:1px solid @color-border}
.markdown-body :deep(h2){font-size:20px;margin:30px 0 14px}
.markdown-body :deep(h3){font-size:16px;margin:22px 0 10px}
.markdown-body :deep(p),.markdown-body :deep(ul),.markdown-body :deep(ol){margin:10px 0}
.markdown-body :deep(ul),.markdown-body :deep(ol){padding-left:24px}
.markdown-body :deep(code){padding:2px 5px;border-radius:3px;background:@color-bg-muted;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}
.markdown-body :deep(pre){padding:14px;overflow:auto;background:#171914;color:#f4f5ef;border-radius:@radius-sm}
.markdown-body :deep(pre code){padding:0;background:transparent;color:inherit}
.markdown-body :deep(table){display:block;width:100%;overflow:auto;border-collapse:collapse;margin:14px 0}
.markdown-body :deep(th),.markdown-body :deep(td){padding:8px 10px;border:1px solid @color-border;text-align:left;white-space:nowrap}
.markdown-body :deep(th){background:@color-bg-muted}
.markdown-body :deep(blockquote){margin:14px 0;padding:2px 14px;border-left:3px solid @color-primary;color:@color-text-secondary}
.markdown-body :deep(a){color:@color-primary;text-decoration:underline}
</style>
