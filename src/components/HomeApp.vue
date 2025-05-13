<template>
  <div class="container">
    <div class="title">
      <h1>Test Carto</h1>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.title h1 {
  font-size: 12vmin;
  font-weight: 900;
  font-family: "Montserrat", sans-serif;
  color: black;
}
</style>
