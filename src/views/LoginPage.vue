<template>
  <form>
    <!-- 文本输入框 -->
    <label for="name">用户名:</label>
    <input type="text" v-model="loginForm.name" name="name" required />

    <br />

    <!-- 密码输入框 -->
    <label for="password">密码:</label>
    <input type="password" v-model="loginForm.password" name="password" required />

    <br />

    <!-- 单选按钮 -->
    <label>性别:</label>
    <input type="radio" v-model="loginForm.gender" name="gender" value="male" />
    <label for="male">男</label>
    <input type="radio" v-model="loginForm.gender" name="gender" value="female" />
    <label for="female">女</label>

    <br />

    <!-- 复选框 -->
    <input type="checkbox" v-model="loginForm.subscribe" name="subscribe" />
    <label for="subscribe">订阅推送信息</label>

    <br />

    <!-- 下拉列表 -->
    <label for="country">国家:</label>
    <select id="country" v-model="loginForm.country" name="country">
      <option value="cn">CN</option>
      <option value="usa">USA</option>
      <option value="uk">UK</option>
    </select>

    <br />

    <!-- 提交按钮 -->
    <button @click="submit">提交</button>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const loginForm = reactive({
  name: '',
  password: '',
  gender: 'male',
  subscribe: false,
  country: 'cn',
});

const submit = () => {
  console.log(loginForm);
};

</script>

<style scoped>
.IndexPage {
  text-align: center;
  margin-top: 50px;
}
</style>
