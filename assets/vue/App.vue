<template>
  <div>
    <h2>Hello from Vue</h2>
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      message: 'This is a reusable component!'
    }
  },
  created() {
    console.log('App component created');
  },
  mounted() {
    console.log('App component mounted');
  },
  updated() {
    console.log('App component updated');
  }
}
</script>
