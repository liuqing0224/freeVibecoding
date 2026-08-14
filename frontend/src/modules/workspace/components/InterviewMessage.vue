<script setup lang="ts">
import { computed } from 'vue'
import type { InterviewMessage } from '../types'

interface ParsedQuestion {
  prompt: string
  options: Array<{ label: string; text: string }>
  note: string
}

const props = defineProps<{ message: InterviewMessage }>()

function parseQuestion(value: string): ParsedQuestion {
  const matches = [...value.matchAll(/([A-E])\.\s*([^；;\n]+)/g)]
  if (!matches.length) return { prompt: value.trim(), options: [], note: '' }

  const last = matches.at(-1)!
  const lastEnd = (last.index ?? 0) + last[0].length
  return {
    prompt: value.slice(0, matches[0].index).trim(),
    options: matches.map((match) => ({ label: match[1], text: match[2].trim() })),
    note: value.slice(lastEnd).replace(/^[；;\s]+/, '').trim(),
  }
}

const rendered = computed(() => {
  if (props.message.role === 'user') return { body: props.message.content, questions: [] }

  const marker = props.message.content.match(/\n\n(?:接下来请确认|还需要确认)：\n/)
  if (!marker?.index) return { body: props.message.content, questions: [] }

  const questionText = props.message.content.slice(marker.index + marker[0].length)
  return {
    body: props.message.content.slice(0, marker.index).trim(),
    questions: questionText.split('\n').map((line) => line.replace(/^\s*-\s*/, '').trim()).filter(Boolean).map(parseQuestion),
  }
})
</script>

<template>
  <article class="message" :class="message.role">
    <strong>{{ message.role === 'user' ? '你' : '访谈助手' }}</strong>
    <p class="message__body">{{ rendered.body }}</p>
    <section v-if="rendered.questions.length" class="questions">
      <header><span>待确认</span><b>{{ rendered.questions.length }} 个问题</b></header>
      <article v-for="(question, index) in rendered.questions" :key="`${index}-${question.prompt}`" class="question">
        <div class="question__title"><i>{{ index + 1 }}</i><p>{{ question.prompt }}</p></div>
        <ul v-if="question.options.length">
          <li v-for="option in question.options" :key="option.label"><b>{{ option.label }}</b><span>{{ option.text }}</span></li>
        </ul>
        <small v-if="question.note">{{ question.note }}</small>
      </article>
    </section>
  </article>
</template>

<style scoped lang="less">
.message{max-width:91%;min-width:0}.message>strong{display:block;margin-bottom:7px;font-size:10px;font-weight:800;text-transform:uppercase;color:@color-text-secondary}.message__body{white-space:pre-wrap;font-size:14px;line-height:1.7}.message.user{align-self:flex-end;padding:13px 15px;border:1px solid @color-border-strong;border-radius:@radius-md;background:@color-primary;box-shadow:3px 3px 0 @color-border-strong}.message.user>strong{color:#44551e}.message.assistant{align-self:flex-start;width:100%}.questions{margin-top:16px;border:1px solid @color-border-strong;border-radius:@radius-md;background:#fff;overflow:hidden;box-shadow:4px 4px 0 #dfe0d7}.questions>header{height:42px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid @color-border-strong;background:#171814;color:#fff}.questions>header span{font-size:12px;font-weight:800}.questions>header b{font-size:11px;font-weight:600;color:@color-primary}.question{padding:16px}.question+.question{border-top:1px solid @color-border-strong}.question__title{display:grid;grid-template-columns:24px minmax(0,1fr);gap:10px;align-items:start}.question__title i{display:grid;place-items:center;width:24px;height:24px;border-radius:@radius-sm;background:@color-primary;border:1px solid @color-border-strong;color:@color-text;font-size:11px;font-style:normal;font-weight:800}.question__title p{font-size:14px;line-height:1.55;font-weight:750;padding-top:1px}.question ul{display:grid;gap:7px;margin:12px 0 0 34px;list-style:none}.question li{display:grid;grid-template-columns:25px minmax(0,1fr);gap:9px;align-items:start;padding:9px 11px;border:1px solid @color-border;border-radius:@radius-sm;background:#f7f8f3;transition:border-color @transition-fast,background-color @transition-fast}.question li:hover{border-color:@color-border-strong;background:#fff}.question li b{display:grid;place-items:center;width:23px;height:23px;border-radius:@radius-sm;background:#171814;color:@color-primary;font-size:11px}.question li span{font-size:13px;line-height:1.55;padding-top:1px}.question small{display:block;margin:10px 0 0 34px;color:@color-text-secondary;font-size:12px}@media(max-width:640px){.message{max-width:100%}.questions{margin-top:13px;box-shadow:3px 3px 0 #dfe0d7}.question{padding:13px}.question ul{margin-left:0}.question small{margin-left:34px}}
</style>
