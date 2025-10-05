<template>
  <header class="bg-black/30 border-b border-purple-500/30 p-4">
    <div class="container mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="/meteor.png" alt="Meteor" style="width: 24px; height: 24px; object-fit: contain;" />
        <h1 class="text-2xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors" @click="$emit('navigate', 'home')">
          Meteor Madness
        </h1>
      </div>
      <div class="flex items-center gap-4">
        <Button 
          @click="$emit('navigate', 'about')"
          icon="pi pi-info-circle"
          label="About"
          class="transparent-button"
          text
          size="small"
        />
        <div class="text-purple-300 text-sm">NASA Space Apps Challenge 2025</div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import Button from 'primevue/button'

// Define emits for navigation
defineEmits<{
  navigate: [page: 'home' | 'about']
}>()
</script>

<style scoped>
.transparent-button {
  background: transparent !important;
  border: none !important;
  color: rgb(196 181 253) !important; /* text-purple-300 */
}

.transparent-button:hover {
  background: rgba(147, 51, 234, 0.1) !important;
  color: rgb(96 165 250) !important; /* text-blue-400 */
}

.transparent-button:focus {
  box-shadow: none !important;
}
</style>
