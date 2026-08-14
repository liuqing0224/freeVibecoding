<script setup lang="ts">
import type { DocumentField } from '../types'

const props = defineProps<{ field: DocumentField; modelValue: unknown }>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

function listValue() { return Array.isArray(props.modelValue) ? props.modelValue as unknown[] : [] }
function updateListText(value: string) { emit('update:modelValue', value.split('\n').map((item) => item.trim()).filter(Boolean)) }
function addRow() { const row = Object.fromEntries((props.field.columns ?? []).map((column) => [column.id, ''])); emit('update:modelValue', [...listValue(), row]) }
function updateCell(index: number, key: string, value: string) { const rows = listValue().map((row) => ({ ...(row as Record<string, unknown>) })); (rows[index] as Record<string, unknown>)[key] = value; emit('update:modelValue', rows) }
function removeRow(index: number) { emit('update:modelValue', listValue().filter((_, rowIndex) => rowIndex !== index)) }
</script>

<template>
  <div class="field">
    <label :for="field.id">{{ field.label }} <span v-if="field.required">必填</span></label>
    <p v-if="field.help">{{ field.help }}</p>
    <textarea v-if="field.type === 'textarea'" :id="field.id" :value="String(modelValue ?? '')" rows="5" @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" />
    <select v-else-if="field.type === 'select'" :id="field.id" :value="String(modelValue ?? '')" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option value="">请选择</option><option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <textarea v-else-if="field.type === 'checklist' || field.type === 'multiselect'" :id="field.id" :value="listValue().join('\n')" rows="4" placeholder="每行一项" @input="updateListText(($event.target as HTMLTextAreaElement).value)" />
    <div v-else-if="field.type === 'table'" class="field__table">
      <table><thead><tr><th v-for="column in field.columns" :key="column.id">{{ column.label }}</th><th></th></tr></thead>
        <tbody><tr v-for="(row, index) in listValue()" :key="index"><td v-for="column in field.columns" :key="column.id"><input :value="String((row as Record<string, unknown>)[column.id] ?? '')" @input="updateCell(index, column.id, ($event.target as HTMLInputElement).value)" /></td><td><button type="button" title="删除此行" @click="removeRow(index)">×</button></td></tr></tbody></table>
      <button type="button" class="field__add" @click="addRow">+ 添加一行</button>
    </div>
    <input v-else :id="field.id" :value="String(modelValue ?? '')" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
  </div>
</template>

<style scoped lang="less">
.field{display:flex;flex-direction:column;gap:6px}.field label{font-size:13px;font-weight:650;color:@color-text}.field label span{margin-left:6px;font-size:11px;color:@color-danger;font-weight:500}.field p{font-size:12px;color:@color-text-secondary}input,textarea,select{width:100%;border:1px solid @color-border-strong;border-radius:@radius-sm;padding:9px 10px;background:#fff;color:@color-text;line-height:1.5}textarea{resize:vertical}input:focus,textarea:focus,select:focus{outline:2px solid rgba(37,99,235,.15);border-color:@color-primary}.field__table{overflow:auto}table{width:100%;border-collapse:collapse;min-width:480px}th,td{border:1px solid @color-border;padding:6px;text-align:left}th{font-size:12px;color:@color-text-secondary;background:@color-bg-muted}td input{border:0;padding:6px}td button{border:0;background:transparent;color:@color-danger;font-size:18px;cursor:pointer}.field__add{margin-top:8px;border:1px dashed @color-border-strong;background:#fff;padding:7px 10px;border-radius:@radius-sm;color:@color-primary;cursor:pointer}
</style>
