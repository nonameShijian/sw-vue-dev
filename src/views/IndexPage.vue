<template>
  <div class="IndexPage">
    <h1>service-worker测试实时编译vue文件</h1>
    <RouterLink to="/login">Go to Login</RouterLink>
    <br/>
    <RouterLink to="/register">Go to register</RouterLink>
    <br/>
    <RouterLink to="/aaaabbb">Go to notFound</RouterLink>
    <br/>
    <HelloWorld :msg="msg"></HelloWorld>
  </div>
</template>

<script setup lang="ts">
import HelloWorld from '../components/HelloWorld.vue';

const msg: string = 'Hello, Vue 3!';
</script>

<style scoped>
.IndexPage {
  text-align: center;
  margin-top: 50px;
}
</style>