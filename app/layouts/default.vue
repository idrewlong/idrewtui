<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tabs } from '~/data/navigation'
import { profile } from '~/data/profile'
import { projects } from '~/data/projects'
import { experience } from '~/data/experience'
import { useKeybindings, type ShortcutAction } from '~/composables/useKeybindings'
import { useStatusLine } from '~/composables/useStatusLine'
import { useTheme } from '~/composables/useTheme'
import { useClipboard } from '~/composables/useClipboard'
import { useOverlay } from '~/composables/useOverlay'
import { useFind } from '~/composables/useFind'
import { useYankContext } from '~/composables/useYankContext'
import { formatRecruiterCard } from '~/utils/recruiter-card'
import { track } from '~/utils/analytics'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const { message, flash } = useStatusLine()
const { theme, cycle: cycleTheme } = useTheme()
const { copy } = useClipboard()
const overlay = useOverlay()
const find = useFind()
const yank = useYankContext()

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
  const from = currentIndex.value === -1 ? 0 : currentIndex.value
  goToTab((from + delta + tabs.length) % tabs.length)
}

async function copyEmail() {
  const email = profile.contact.find(c => c.channel === 'email')
  if (!email) return
  const ok = await copy(email.value)
  flash(ok ? `yanked ${email.value}` : `could not copy ${email.value}`)
}

async function copyCard() {
  const extra = yank.resolve()
  const text = formatRecruiterCard({
    siteUrl: String(config.public.siteUrl),
    ...extra,
  })
  const ok = await copy(text)
  flash(ok ? 'yanked recruiter card' : 'could not copy')
}

function openResume() {
  track({ name: 'resume_download' })
  window.open(profile.resumeUrl, '_blank', 'noopener')
}

function onThemeCycle() {
  const next = cycleTheme()
  flash(`theme → ${next}`)
}

function scrollToEdge(position: 'top' | 'bottom') {
  window.scrollTo({
    top: position === 'top' ? 0 : document.body.scrollHeight,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

const pageHandlers = ref<Partial<Record<ShortcutAction, () => void>>>({})
provide('registerPageShortcuts', (h: Partial<Record<ShortcutAction, () => void>>) => {
  pageHandlers.value = h
})

function delegate(action: ShortcutAction) {
  return () => pageHandlers.value[action]?.()
}

function dialogOpen() {
  const mode = overlay.mode.value
  return mode === 'palette' || mode === 'help' || mode === 'pager' || mode === 'compose'
}

function revealHash() {
  const id = route.hash.replace(/^#/, '')
  if (!id) return
  const el = document.getElementById(id)
  if (!el) return
  if (el instanceof HTMLDetailsElement) el.open = true
  el.scrollIntoView({ block: 'start' })
  if (projects.some(p => p.slug === id)) yank.setProject(id)
  if (experience.some(r => r.slug === id)) yank.setRole(id)
}

watch(() => route.fullPath, async () => {
  yank.extra.value = null
  await nextTick()
  revealHash()
})

watch(() => overlay.mode.value, async (mode) => {
  if (mode === 'find') await find.focusInput()
})

onMounted(() => {
  document.documentElement.dataset.ready = 'true'
  revealHash()
})

useKeybindings({
  'tab:1': () => { if (!dialogOpen()) goToTab(0) },
  'tab:2': () => { if (!dialogOpen()) goToTab(1) },
  'tab:3': () => { if (!dialogOpen()) goToTab(2) },
  'tab:4': () => { if (!dialogOpen()) goToTab(3) },
  'tab:prev': () => { if (!dialogOpen()) step(-1) },
  'tab:next': () => { if (!dialogOpen()) step(1) },

  'scroll:top': () => { if (!dialogOpen()) scrollToEdge('top') },
  'scroll:bottom': () => { if (!dialogOpen()) scrollToEdge('bottom') },

  'resume:open': () => { if (!dialogOpen()) openResume() },
  'email:copy': () => { if (!dialogOpen()) copyEmail() },
  'card:copy': (event) => {
    if (dialogOpen()) return
    track({ name: 'shortcut_used', key: event.key })
    copyCard()
  },
  'theme:toggle': () => { if (!dialogOpen()) onThemeCycle() },
  'help:toggle': () => overlay.toggle('help'),
  'palette:open': (event) => {
    track({ name: 'shortcut_used', key: event.key })
    overlay.toggle('palette')
  },
  'compose:open': (event) => {
    track({ name: 'shortcut_used', key: event.key })
    overlay.toggle('compose')
  },
  'find:open': (event) => {
    track({ name: 'shortcut_used', key: event.key })
    if (overlay.mode.value === 'find') {
      find.focusInput()
      return
    }
    overlay.toggle('find')
  },
  'find:next': (event) => {
    if (dialogOpen()) return
    track({ name: 'shortcut_used', key: event.key })
    find.next()
  },
  'find:prev': (event) => {
    if (dialogOpen()) return
    track({ name: 'shortcut_used', key: event.key })
    find.prev()
  },
  'overlay:close': () => {
    if (overlay.mode.value === 'find') find.close()
    else overlay.close()
  },

  'list:down': () => { if (!dialogOpen()) delegate('list:down')() },
  'list:up': () => { if (!dialogOpen()) delegate('list:up')() },
  'list:open': () => { if (!dialogOpen()) delegate('list:open')() },
  'projects:filter': () => {
    if (dialogOpen()) return
    delegate('projects:filter')()
    find.rescan()
  },
})
</script>

<template>
  <div class="shell">
    <a class="skip" href="#main">Skip to content</a>

    <div class="shell__frame dash">
      <PanelsWhoamiPanel class="dash__whoami" />
      <PanelsVisitorPanel class="dash__visitor" />
      <PanelsMetersPanel class="dash__meters" />

      <div class="dash__content frame">
        <TuiTabBar />

        <TuiPane>
          <main id="main" tabindex="-1">
            <TuiFindBar />
            <slot />
          </main>
        </TuiPane>

        <TuiStatusLine
          :path="currentPath"
          :message="message"
          :theme="theme"
          :mode="overlay.label.value"
          @help="overlay.open('help')"
          @cycle-theme="onThemeCycle"
          @palette="overlay.toggle('palette')"
          @find="overlay.mode.value === 'find' ? find.close() : overlay.open('find')"
          @compose="overlay.toggle('compose')"
        />
      </div>

      <PanelsWeatherPanel class="dash__wx" />
      <PanelsSessionPanel class="dash__session" />
      <PanelsGithubPanel class="dash__github" />
    </div>

    <TuiHelpOverlay />
    <TuiPalette @resume="openResume" @yank-email="copyEmail" @yank-card="copyCard" />
    <TuiPager />
    <TuiCompose />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  padding: 1rem 0.75rem 2rem;
  display: flex;
  justify-content: center;
  min-width: 0;
  max-width: 100%;
  overflow-x: clip;
}

.shell__frame {
  width: 100%;
  max-width: 100rem;
  min-width: 0;
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
