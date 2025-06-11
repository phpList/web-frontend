<template>
  <div>
    <h2>Hello from MyWidget</h2>
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'MyWidget',
  data() {
    return {
      message: 'This is a reusable component!'
    }
  }
}
</script>
