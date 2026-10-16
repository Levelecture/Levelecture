<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '$components/ui/button/button.svelte';
	import { cn } from '$lib/utils.js';

	let { oncomplete, children }: { oncomplete: () => void; children?: Snippet } = $props();

	const HOLD_MS = 800;
	let holding = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function start(event: PointerEvent) {
		if (event.button !== 0 || holding) return;
		holding = true;
		timer = setTimeout(() => {
			timer = undefined;
			holding = false;
			oncomplete();
		}, HOLD_MS);
	}

	function cancel() {
		if (timer) clearTimeout(timer);
		timer = undefined;
		holding = false;
	}
</script>

<Button
	variant="destructive"
	size="sm"
	title="Tahan untuk menghapus"
	class="relative touch-manipulation overflow-hidden select-none"
	onpointerdown={start}
	onpointerup={cancel}
	onpointerleave={cancel}
	onpointercancel={cancel}
	oncontextmenu={(event) => event.preventDefault()}
>
	<span
		class={cn(
			'bg-destructive/40 pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-800 ease-linear',
			holding ? 'w-full' : 'w-0'
		)}
	></span>
	<span class="relative">{@render children?.()}</span>
</Button>
