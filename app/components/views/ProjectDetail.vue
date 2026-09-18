<script setup lang="ts">
import type { Project } from '~/types/content'
import { track } from '~/utils/analytics'

defineProps<{ project: Project }>()
</script>

<template>
  <div class="detail">
    <dl v-if="project.detail" class="kv">
      <template v-if="project.detail.role">
        <dt>Role</dt><dd>{{ project.detail.role }}</dd>
      </template>
      <template v-if="project.detail.stack?.length">
        <dt>Stack</dt><dd>{{ project.detail.stack.join(' · ') }}</dd>
      </template>
      <template v-if="project.detail.challenge">
        <dt>Hard part</dt><dd>{{ project.detail.challenge }}</dd>
      </template>
      <template v-if="project.detail.outcome">
        <dt>Outcome</dt><dd>{{ project.detail.outcome }}</dd>
      </template>
    </dl>

    <p v-if="project.tags.length" class="tags">
      <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
    </p>

    <a
      v-if="project.href"
      class="link"
      :href="project.href"
      target="_blank"
      rel="noopener"
      @click="track({ name: 'project_open', slug: project.slug })"
    >
      {{ project.href.replace(/^https?:\/\//, '') }}<span aria-hidden="true"> ↗</span>
      <span class="visually-hidden">(opens in a new tab)</span>
    </a>
    <p v-else class="todo">link pending</p>

    <TuiCast v-if="project.cast" :src="project.cast" />
  </div>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 10ch 1fr;
  gap: 0.15rem 1rem;
  margin-bottom: 0.5rem;
}
.kv dt { color: var(--muted); }
.kv dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
  margin: 0 0 0.5rem;
}

.tag {
  font-size: var(--text-status);
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 0 0.6ch;
}

.link { color: var(--link); }

.todo {
  color: var(--danger);
  font-size: var(--text-status);
  margin: 0;
}
</style>
