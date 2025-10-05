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
        <button 
          @click="$emit('navigate', 'about')"
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          About
        </button>
        <div class="text-purple-300 text-sm">NASA Space Apps Challenge 2025</div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// Define emits for navigation
defineEmits<{
  navigate: [page: 'home' | 'about']
}>()
</script>
