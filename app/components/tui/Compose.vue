<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { profile } from '~/data/profile'
import { useOverlay } from '~/composables/useOverlay'
import { composeMailto } from '~/utils/mailto'
import { track } from '~/utils/analytics'

/**
 * aerc-style compose. The send control is a real mailto: link — no form
 * backend on this static site.
 */
const overlay = useOverlay()
const open = computed(() => overlay.mode.value === 'compose')

const email = profile.contact.find(channel => channel.channel === 'email')
const to = email?.value ?? ''

const subject = ref('')
const body = ref('')

watch(open, (isOpen) => {
  if (isOpen) {
    subject.value = ''
    body.value = ''
  }
})

const href = computed(() => composeMailto({
  to,
  subject: subject.value,
  body: body.value,
}))

function onSend() {
  track({ name: 'contact_click', channel: 'email' })
}
</script>

<template>
  <TuiOverlay
    :open="open"
    title="aerc compose"
    title-id="compose-title"
    close-label="compose"
    size="wide"
    @close="overlay.close()"
  >
    <form class="compose" @submit.prevent>
      <dl class="headers">
        <dt>To</dt>
        <dd>{{ to }}</dd>
        <dt><label for="compose-subject">Subject</label></dt>
        <dd>
          <input
            id="compose-subject"
            v-model="subject"
            data-overlay-focus
            type="text"
            autocomplete="off"
            spellcheck="true"
          >
        </dd>
      </dl>

      <label class="visually-hidden" for="compose-body">Message</label>
      <textarea
        id="compose-body"
        v-model="body"
        rows="8"
        spellcheck="true"
      />

      <div class="actions">
        <a
          class="send"
          :href="href"
          @click="onSend"
        >
          [ send ]
        </a>
      </div>
    </form>
  </TuiOverlay>
</template>

<style scoped>
.headers {
  display: grid;
  grid-template-columns: 8ch 1fr;
  gap: 0.35rem 1ch;
  align-items: baseline;
  margin: 0.75rem 0;
}

.headers dt { color: var(--muted); }
.headers dd { margin: 0; min-width: 0; }

input,
textarea {
  width: 100%;
  font: inherit;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--line);
  padding: 0.25rem 0.6ch;
}

textarea {
  min-height: 10rem;
  resize: vertical;
  margin-bottom: 0.75rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.send {
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 0.35rem 1ch;
  min-height: 1.5rem;
  text-decoration: none;
}
.send:hover { background: var(--surface-hi); }
</style>
