<script lang="ts">
	import { untrack } from 'svelte';
	import PencilIcon from '@lucide/svelte/icons/pencil';

	let {
		value = null,
		onchange
	}: {
		value?: string | null;
		onchange?: (value: string) => void;
	} = $props();

	let editing = $state(false);
	let local = $state(untrack(() => value ?? ''));
	let previous = '';

	function safeHref(raw: string | null): string | null {
		const text = (raw ?? '').trim();
		if (!text) return null;
		let url: URL;
		try {
			url = new URL(text);
		} catch {
			try {
				url = new URL(`https://${text}`);
			} catch {
				return null;
			}
		}
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
	}

	function displayUrl(href: string | null, raw: string): string {
		if (!href) return raw;
		const url = new URL(href);
		const label = `${url.host}${url.pathname}${url.search}`.replace(/\/$/, '');
		return label.length > 48 ? `${label.slice(0, 48)}…` : label;
	}

	const href = $derived(safeHref(local));
	const label = $derived(displayUrl(href, local));

	function enterEdit() {
		previous = local;
		editing = true;
	}

	function commit() {
		editing = false;
		const next = local.trim();
		local = next;
		if (next !== (value ?? '')) onchange?.(next);
	}

	function cancel() {
		local = previous;
		editing = false;
	}

	function autofocus(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

{#if editing}
	<input
		{@attach autofocus}
		value={local}
		placeholder="Empty"
		oninput={(event) => (local = event.currentTarget.value)}
		onblur={commit}
		onkeydown={(event) => {
			if (event.key === 'Enter') event.currentTarget.blur();
			if (event.key === 'Escape') cancel();
		}}
		class="focus:ring-ring w-full bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-inset"
	/>
{:else}
	<div class="flex w-full items-center gap-1.5 px-3 py-2 text-sm">
		{#if href}
			<a
				{href}
				target="_blank"
				rel="noopener noreferrer"
				title={local}
				class="text-primary hover:underline min-w-0 flex-1 truncate"
			>
				{label}
			</a>
		{:else if local}
			<span class="text-muted-foreground min-w-0 flex-1 truncate" title="Link tidak valid">
				{local}
			</span>
		{:else}
			<button
				type="button"
				onclick={enterEdit}
				class="text-muted-foreground/50 min-w-0 flex-1 cursor-pointer text-left"
			>
				Empty
			</button>
		{/if}
		<button
			type="button"
			onclick={enterEdit}
			aria-label="Ubah link"
			title="Ubah link"
			class="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 cursor-pointer rounded-md p-1 transition-colors"
		>
			<PencilIcon class="size-3" />
		</button>
	</div>
{/if}
