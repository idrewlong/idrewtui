<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tabs } from '~/data/navigation'
import { profile } from '~/data/profile'
import { useKeybindings, type ShortcutAction } from '~/composables/useKeybindings'
import { useStatusLine } from '~/composables/useStatusLine'
import { useTheme } from '~/composables/useTheme'
import { useClipboard } from '~/composables/useClipboard'
import { track } from '~/utils/analytics'

/**
 * Persistent chrome: tab bar, pane, status line. Global shortcuts are wired
 * here because they act on navigation and app-level state; list-local keys
 * (j/k/Enter/f) are handled by the page that owns the list.
 */
const route = useRoute()
const router = useRouter()

const { message, flash } = useStatusLine()
const { theme, toggle: toggleTheme } = useTheme()
const { copy } = useClipboard()

const helpOpen = ref(false)

const currentTab = computed(() => tabs.find(t => t.to === route.path))
const currentPath = computed(() => currentTab.value?.path ?? route.path)
const currentIndex = computed(() => tabs.findIndex(t => t.to === route.path))

function goToTab(index: number) {
  const tab = tabs[index]
  if (!tab || tab.to === route.path) return
  track({ name: 'tab_switch', tab: tab.label })
  router.push(tab.to)
}

function step(delta: number) {
  // Wrap around; from an unknown route (404) start at the first tab.
  const from = currentIndex.value === -1 ? 0 : currentIndex.value
  goToTab((from + delta + tabs.length) % tabs.length)
}

async function copyEmail() {
  const email = profile.contact.find(c => c.channel === 'email')
  if (!email) return
  const ok = await copy(email.value)
  flash(ok ? `yanked ${email.value}` : `could not copy ${email.value}`)
}

function openResume() {
  track({ name: 'resume_download' })
  window.open(profile.resumeUrl, '_blank', 'noopener')
}

function onThemeToggle() {
  const next = toggleTheme()
  flash(`theme → ${next}`)
}

function scrollToEdge(position: 'top' | 'bottom') {
  window.scrollTo({
    top: position === 'top' ? 0 : document.body.scrollHeight,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

/**
 * Pages register the shortcuts that only make sense for their own list.
 * `provide` rather than props, because the page renders inside <slot/>.
 */
const pageHandlers = ref<Partial<Record<ShortcutAction, () => void>>>({})
provide('registerPageShortcuts', (h: Partial<Record<ShortcutAction, () => void>>) => {
  pageHandlers.value = h
})

function delegate(action: ShortcutAction) {
  return () => pageHandlers.value[action]?.()
}

/**
 * Marks the document interactive once the keydown listener below is attached.
 * `.js-only` visibility is handled separately, before first paint, by the
 * inline script in app.vue — doing it here would shift the layout.
 */
onMounted(() => {
  document.documentElement.dataset.ready = 'true'
})

useKeybindings({
  'tab:1': () => goToTab(0),
  'tab:2': () => goToTab(1),
  'tab:3': () => goToTab(2),
  'tab:4': () => goToTab(3),
  'tab:prev': () => step(-1),
  'tab:next': () => step(1),

  'scroll:top': () => scrollToEdge('top'),
  'scroll:bottom': () => scrollToEdge('bottom'),

  'resume:open': openResume,
  'email:copy': copyEmail,
  'theme:toggle': onThemeToggle,
  'help:toggle': () => { helpOpen.value = !helpOpen.value },
  'overlay:close': () => { helpOpen.value = false },

  'list:down': delegate('list:down'),
  'list:up': delegate('list:up'),
  'list:open': delegate('list:open'),
  'projects:filter': delegate('projects:filter'),
})
</script>

<template>
  <div class="shell">
    <a class="skip" href="#main">Skip to content</a>

    <!-- One frame: the tab bar and status line sit inset in its border. -->
    <div class="shell__frame frame">
      <TuiTabBar />

      <TuiPane>
        <main id="main" tabindex="-1">
          <slot />
        </main>
      </TuiPane>

      <TuiStatusLine
        :path="currentPath"
        :message="message"
        :theme="theme"
        @help="helpOpen = true"
        @toggle-theme="onThemeToggle"
      />
    </div>

    <TuiHelpOverlay v-model="helpOpen" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  padding: 1rem 0.75rem 2rem;
  display: flex;
  justify-content: center;
}

.shell__frame {
  width: 100%;
  max-width: var(--pane-width);
}

main:focus { outline: none; }

.skip {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--surface);
  color: var(--fg);
  padding: 0.5rem 1rem;
  border: 1px solid var(--accent);
  z-index: 100;
}
.skip:focus {
  left: 1rem;
  top: 1rem;
}

@media (min-width: 40rem) {
  .shell { padding: 2rem 1rem 3rem; }
}
</style>
