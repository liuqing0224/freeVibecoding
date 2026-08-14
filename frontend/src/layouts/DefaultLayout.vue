<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="layout">
    <header>
      <RouterLink to="/projects" class="brand">
        <span>VC</span>
        <strong>vibecoding工作台</strong>
      </RouterLink>
      <nav>
        <RouterLink to="/projects">项目</RouterLink>
        <RouterLink to="/settings">设置</RouterLink>
      </nav>
    </header>
    <main><RouterView /></main>
  </div>
</template>
<style scoped lang="less">
.layout{min-height:100vh;background:@color-bg-muted}.layout>header{height:64px;padding:0 28px;background:#171814;border-bottom:1px solid #171814;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:11px;color:#fff}.brand:hover{color:#fff}.brand span{display:grid;place-items:center;width:30px;height:30px;border-radius:@radius-sm;background:@color-primary;color:@color-text;font-size:11px;font-weight:800;box-shadow:2px 2px 0 #fff}.brand strong{font-size:15px;font-weight:700}.layout nav{display:flex;align-items:center;gap:4px}.layout nav a{padding:8px 13px;border:1px solid transparent;border-radius:@radius-sm;color:#bfc1b8;font-size:13px;font-weight:600}.layout nav a:hover{color:#fff}.layout nav a.router-link-active{background:@color-primary;border-color:@color-primary;color:@color-text}.layout main{padding:28px}@media(max-width:640px){.layout main{padding:14px}.layout>header{height:58px;padding:0 16px}.brand strong{font-size:14px}.layout nav a{padding:7px 9px}}
</style>
